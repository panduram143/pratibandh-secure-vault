const router = require('express').Router();
const Case = require('../models/Case');
const Document = require('../models/Document');
const fs = require('fs');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { logAction } = require('../middleware/auditLogger');

// all routes need auth
router.use(auth);

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

        const cases = await Case.find({
            $text: { $search: q }
        }).populate('createdBy', 'name email')
          .populate('assignedOfficers', 'name badgeId')
          .limit(20);

        res.json(cases);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// POST /api/cases
router.post('/', async (req, res) => {
    try {
        const newCase = new Case({
            ...req.body,
            createdBy: req.user._id
        });

        await newCase.save();
        await logAction(req.user._id, 'upload', 'case', newCase.caseId, 'Created new case', req);

        res.status(201).json(newCase);
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

        const cases = await Case.find(filter)
            .populate('createdBy', 'name email')
            .populate('assignedOfficers', 'name badgeId')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Case.countDocuments(filter);

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
            .populate('createdBy', 'name email role')
            .populate('assignedOfficers', 'name email badgeId')
            .populate('sharedWith.grantedBy', 'name');

        if (!caseDoc) {
            return res.status(404).json({ msg: 'Case not found' });
        }

        await logAction(req.user._id, 'view', 'case', caseDoc.caseId, 'Viewed case details', req);

        res.json(caseDoc);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// PUT /api/cases/:id
router.put('/:id', async (req, res) => {
    try {
        const caseDoc = await Case.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!caseDoc) {
            return res.status(404).json({ msg: 'Case not found' });
        }

        await logAction(req.user._id, 'edit', 'case', caseDoc.caseId, 'Updated case', req);

        res.json(caseDoc);
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
        const isAdmin = req.user.role === 'super_admin';

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

        // check if already shared with this station
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

        res.json({ msg: 'Case shared successfully', case: caseDoc });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
