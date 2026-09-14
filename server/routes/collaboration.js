const router = require('express').Router();
const Case = require('../models/Case');
const auth = require('../middleware/auth');
const { logAction } = require('../middleware/auditLogger');

// all routes need auth
router.use(auth);

// GET /api/collaboration/shared-with-us
router.get('/shared-with-us', async (req, res) => {
    try {
        const userStation = req.user.station || req.user.department;

        const cases = await Case.find({
            'sharedWith.station': userStation
        })
            .populate('createdBy', 'name email')
            .populate('sharedWith.grantedBy', 'name')
            .sort({ createdAt: -1 });

        const formattedCases = cases.map(c => {
            const shareInfo = c.sharedWith.find(s => s.station === userStation);
            return {
                _id: c._id,
                case: {
                    _id: c._id,
                    caseNumber: c.caseNumber,
                    title: c.title,
                    crimeType: c.crimeType
                },
                fromStation: c.station,
                accessLevel: shareInfo?.accessLevel || 'read',
                status: shareInfo?.status || 'approved',
                createdAt: shareInfo?.grantedAt || c.createdAt
            };
        });

        res.json({ cases: formattedCases });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/collaboration/shared-by-us
router.get('/shared-by-us', async (req, res) => {
    try {
        const userStation = req.user.station || req.user.department;

        const cases = await Case.find({
            station: userStation,
            'sharedWith.0': { $exists: true }
        })
            .populate('createdBy', 'name email')
            .populate('sharedWith.grantedBy', 'name')
            .sort({ createdAt: -1 });

        const formattedCases = [];
        cases.forEach(c => {
            c.sharedWith.forEach(share => {
                formattedCases.push({
                    _id: `${c._id}_${share.station}`,
                    case: {
                        _id: c._id,
                        caseNumber: c.caseNumber,
                        title: c.title,
                        crimeType: c.crimeType
                    },
                    toStation: share.station,
                    accessLevel: share.accessLevel,
                    status: share.status || 'approved',
                    createdAt: share.grantedAt
                });
            });
        });

        res.json({ cases: formattedCases });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// POST /api/collaboration/requests
router.post('/requests', async (req, res) => {
    try {
        const { caseId, targetStation, reason } = req.body;

        if (!caseId || !targetStation || !reason) {
            return res.status(400).json({ msg: 'Missing required fields' });
        }

        // Find case by caseNumber or _id
        const caseDoc = await Case.findOne({
            $or: [{ _id: caseId }, { caseNumber: caseId }]
        });

        if (!caseDoc) {
            return res.status(404).json({ msg: 'Case not found' });
        }

        // Check if already shared
        const alreadyShared = caseDoc.sharedWith.find(s => s.station === targetStation);
        if (alreadyShared) {
            return res.status(400).json({ msg: 'Access request already exists for this station' });
        }

        // Add sharing entry
        caseDoc.sharedWith.push({
            station: targetStation,
            accessLevel: 'read',
            grantedBy: req.user._id,
            grantedAt: new Date(),
            status: 'pending'
        });

        await caseDoc.save();
        await logAction(req.user._id, 'share_request', 'case', caseDoc.caseNumber, `Requested access from: ${targetStation}`, req);

        res.status(201).json({ msg: 'Access request sent successfully', case: caseDoc });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// PATCH /api/collaboration/requests/:id
router.patch('/requests/:id', async (req, res) => {
    try {
        const { status } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status' });
        }

        // This is a simplified implementation
        // In production, you'd want proper request tracking
        res.json({ msg: `Request ${status} successfully` });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
