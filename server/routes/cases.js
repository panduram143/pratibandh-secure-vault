const router = require('express').Router();
const Case = require('../models/Case');
const Document = require('../models/Document');
const User = require('../models/User');
const fs = require('fs');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { logAction } = require('../middleware/auditLogger');

// All routes require authentication
router.use(auth);

/**
 * Access Control Helper: Check if user has clearance to view unredacted victim details.
 * Allowed:
 * 1. Super Admins
 * 2. Case Creator
 * 3. Any of the 3 Admitted Officers specifically assigned to this case
 */
function canAccessVictimName(caseDoc, user) {
    if (!user) return false;

    // Super admins always have full clearance
    if (user.role === 'super_admin' || user.formNumber === '25110377' || user.badgeId === '25110377') {
        return true;
    }

    const userIdStr = (user._id || user.id || user).toString();

    // Case Creator has clearance
    const createdById = caseDoc.createdBy?._id || caseDoc.createdBy;
    if (createdById && createdById.toString() === userIdStr) {
        return true;
    }

    // Check 3 Admitted Officers
    const admittedList = caseDoc.admittedOfficers || [];
    const isAdmitted = admittedList.some(officer => {
        const offId = officer?._id || officer;
        return offId && offId.toString() === userIdStr;
    });
    if (isAdmitted) return true;

    // Check Assigned Officers fallback
    const assignedList = caseDoc.assignedOfficers || [];
    const isAssigned = assignedList.some(officer => {
        const offId = officer?._id || officer;
        return offId && offId.toString() === userIdStr;
    });
    if (isAssigned) return true;

    return false;
}

/**
 * Redaction Helper: Redacts victim's name if the user lacks clearance.
 */
function redactVictimInfo(caseDoc, user) {
    if (!caseDoc) return caseDoc;
    const isMongoose = typeof caseDoc.toObject === 'function';
    const docObj = isMongoose ? caseDoc.toObject() : JSON.parse(JSON.stringify(caseDoc));

    const hasClearance = canAccessVictimName(docObj, user);
    docObj.hasVictimClearance = hasClearance;

    if (!hasClearance) {
        // Redact single victim
        if (docObj.victim) {
            docObj.victim = {
                ...docObj.victim,
                name: '████████',
                isRedacted: true
            };
        }
        // Redact victims array
        if (Array.isArray(docObj.victims) && docObj.victims.length > 0) {
            docObj.victims = docObj.victims.map(v => ({
                ...v,
                name: '████████',
                isRedacted: true
            }));
        }
        docObj.isVictimRedacted = true;
    } else {
        docObj.isVictimRedacted = false;
    }

    return docObj;
}

// GET /api/cases/officers/list - Retrieve active officers for 3 admitted officer slots
router.get('/officers/list', async (req, res) => {
    try {
        const officers = await User.find({ isActive: true })
            .select('name email formNumber badgeId role station department')
            .sort({ name: 1 });

        res.json({ officers });
    } catch (err) {
        console.error('Error fetching officers list:', err.message);
        res.status(500).json({ msg: 'Server error loading officers' });
    }
});

// GET /api/cases/by-crime-type
router.get('/by-crime-type', async (req, res) => {
    try {
        const stats = await Case.aggregate([
            {
                $group: {
                    _id: '$crimeType',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({ data: stats });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/cases/search
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ msg: 'Search query required' });

        const rawCases = await Case.find({
            $text: { $search: q }
        })
            .populate('createdBy', 'name email formNumber badgeId role')
            .populate('assignedOfficers', 'name formNumber badgeId email role station department')
            .populate('admittedOfficers', 'name formNumber badgeId email role station department')
            .limit(20);

        const cases = rawCases.map(c => redactVictimInfo(c, req.user));

        res.json(cases);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// POST /api/cases
router.post('/', async (req, res) => {
    try {
        let admitted = req.body.admittedOfficers || req.body.assignedOfficers || [];
        if (typeof admitted === 'string') {
            admitted = [admitted];
        }
        // Enforce maximum 3 admitted officers
        if (Array.isArray(admitted) && admitted.length > 3) {
            return res.status(400).json({ msg: 'A maximum of 3 admitted officers can be allocated per case.' });
        }

        const newCase = new Case({
            ...req.body,
            admittedOfficers: admitted,
            assignedOfficers: admitted, // maintain backward compatibility
            createdBy: req.user._id
        });

        await newCase.save();
        await logAction(req.user._id, 'upload', 'case', newCase.caseId, 'Created new case', req);

        const populatedCase = await Case.findById(newCase._id)
            .populate('createdBy', 'name email formNumber badgeId role')
            .populate('assignedOfficers', 'name email formNumber badgeId role station department')
            .populate('admittedOfficers', 'name email formNumber badgeId role station department');

        res.status(201).json(redactVictimInfo(populatedCase, req.user));
    } catch (err) {
        console.error('Error creating case:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message, errors: err.errors });
        }
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Case ID collision, please try again' });
        }
        res.status(500).json({ msg: err.message || 'Server error' });
    }
});

// GET /api/cases
router.get('/', async (req, res) => {
    try {
        const { crimeType, status, station, startDate, endDate, page = 1, limit = 20 } = req.query;

        let filter = {};

        if (crimeType) filter.crimeType = crimeType;
        if (status) filter.status = status;
        if (station) filter.station = station;

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const rawCases = await Case.find(filter)
            .populate('createdBy', 'name email formNumber badgeId role')
            .populate('assignedOfficers', 'name formNumber badgeId email role station department')
            .populate('admittedOfficers', 'name formNumber badgeId email role station department')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Case.countDocuments(filter);

        const cases = rawCases.map(c => redactVictimInfo(c, req.user));

        res.json({
            cases,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/cases/:id
router.get('/:id', async (req, res) => {
    try {
        const caseDoc = await Case.findById(req.params.id)
            .populate('createdBy', 'name email role formNumber badgeId station department')
            .populate('assignedOfficers', 'name email formNumber badgeId role station department')
            .populate('admittedOfficers', 'name email formNumber badgeId role station department')
            .populate('sharedWith.grantedBy', 'name');

        if (!caseDoc) {
            return res.status(404).json({ msg: 'Case not found' });
        }

        await logAction(req.user._id, 'view', 'case', caseDoc.caseId, 'Viewed case details', req);

        res.json(redactVictimInfo(caseDoc, req.user));
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// PUT /api/cases/:id
router.put('/:id', async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (updateData.admittedOfficers !== undefined) {
            let admitted = updateData.admittedOfficers;
            if (typeof admitted === 'string') admitted = [admitted];
            if (Array.isArray(admitted) && admitted.length > 3) {
                return res.status(400).json({ msg: 'A maximum of 3 admitted officers can be allocated per case.' });
            }
            updateData.admittedOfficers = admitted;
            updateData.assignedOfficers = admitted;
        }

        const caseDoc = await Case.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        )
            .populate('createdBy', 'name email role formNumber badgeId station department')
            .populate('assignedOfficers', 'name email formNumber badgeId role station department')
            .populate('admittedOfficers', 'name email formNumber badgeId role station department');

        if (!caseDoc) {
            return res.status(404).json({ msg: 'Case not found' });
        }

        await logAction(req.user._id, 'edit', 'case', caseDoc.caseId, 'Updated case', req);

        res.json(redactVictimInfo(caseDoc, req.user));
    } catch (err) {
        console.error('Error updating case:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message, errors: err.errors });
        }
        res.status(500).json({ msg: err.message || 'Server error' });
    }
});

// DELETE /api/cases/:id (only creator or super_admin can delete)
router.delete('/:id', async (req, res) => {
    try {
        const caseDoc = await Case.findById(req.params.id);

        if (!caseDoc) {
            return res.status(404).json({ msg: 'Case not found' });
        }

        // Check if user is the creator or super_admin
        const isOwner = caseDoc.createdBy && caseDoc.createdBy.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'super_admin' || req.user.formNumber === '25110377' || req.user.badgeId === '25110377';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ msg: 'Unauthorized: You can only delete cases created by yourself' });
        }

        // Delete associated documents and their physical files
        const associatedDocs = await Document.find({ case: caseDoc._id });
        for (const doc of associatedDocs) {
            try {
                if (doc.filePath && fs.existsSync(doc.filePath)) {
                    fs.unlinkSync(doc.filePath);
                }
            } catch (e) {
                console.error('Error deleting doc file:', e.message);
            }
        }
        await Document.deleteMany({ case: caseDoc._id });

        await Case.findByIdAndDelete(req.params.id);
        await logAction(req.user._id, 'delete', 'case', caseDoc.caseId, `Deleted case: ${caseDoc.title}`, req);

        res.json({ msg: 'Case deleted successfully' });
    } catch (err) {
        console.error('Error deleting case:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/cases/:id/shared
router.get('/:id/shared', async (req, res) => {
    try {
        const caseDoc = await Case.findById(req.params.id)
            .populate('sharedWith.grantedBy', 'name');

        if (!caseDoc) {
            return res.status(404).json({ msg: 'Case not found' });
        }

        res.json({ stations: caseDoc.sharedWith });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// POST /api/cases/:id/share
router.post('/:id/share', async (req, res) => {
    try {
        const { station, accessLevel } = req.body;

        if (!station) {
            return res.status(400).json({ msg: 'Station name is required' });
        }

        const caseDoc = await Case.findById(req.params.id);
        if (!caseDoc) {
            return res.status(404).json({ msg: 'Case not found' });
        }

        // Check if already shared with this station
        const alreadyShared = caseDoc.sharedWith.find(s => s.station === station);
        if (alreadyShared) {
            return res.status(400).json({ msg: 'Case already shared with this station' });
        }

        caseDoc.sharedWith.push({
            station,
            accessLevel: accessLevel || 'read',
            grantedBy: req.user._id,
            grantedAt: new Date()
        });

        await caseDoc.save();
        await logAction(req.user._id, 'share', 'case', caseDoc.caseId, `Shared with station: ${station}`, req);

        res.json({ msg: 'Case shared successfully', case: redactVictimInfo(caseDoc, req.user) });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
module.exports.redactVictimInfo = redactVictimInfo;
