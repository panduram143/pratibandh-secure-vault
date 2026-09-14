const router = require('express').Router();
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// all routes need auth
router.use(auth);

// GET /api/audit/recent - public endpoint for dashboard (no admin restriction)
router.get('/recent', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const logs = await AuditLog.find()
            .populate('user', 'name email badgeId')
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        res.json({ logs });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Admin-only routes below
router.use(roleCheck(['super_admin', 'station_admin']));

// GET /api/audit
router.get('/', async (req, res) => {
    try {
        const { user, action, resourceType, startDate, endDate, page = 1, limit = 50 } = req.query;

        let filter = {};

        if (user) filter.user = user;
        if (action) filter.action = action;
        if (resourceType) filter.resourceType = resourceType;

        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(filter)
            .populate('user', 'name email badgeId')
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await AuditLog.countDocuments(filter);

        res.json({
            logs,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/audit/user/:userId
router.get('/user/:userId', async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        const logs = await AuditLog.find({ user: req.params.userId })
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await AuditLog.countDocuments({ user: req.params.userId });

        res.json({
            logs,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/audit/document/:docId
router.get('/document/:docId', async (req, res) => {
    try {
        const logs = await AuditLog.find({
            resourceType: 'document',
            resourceId: req.params.docId
        })
            .populate('user', 'name email')
            .sort({ timestamp: -1 });

        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
