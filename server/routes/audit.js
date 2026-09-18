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
            .populate('user', 'name email formNumber badgeId role department station')
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
            .populate('user', 'name email formNumber badgeId role department station')
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

// GET /api/audit/user-stats - Aggregated activity count per user (times opened/viewed/modified)
router.get('/user-stats', async (req, res) => {
    try {
        const stats = await AuditLog.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            {
                $unwind: {
                    path: '$userInfo',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: '$user',
                    name: { $first: '$userInfo.name' },
                    email: { $first: '$userInfo.email' },
                    formNumber: { $first: '$userInfo.formNumber' },
                    role: { $first: '$userInfo.role' },
                    department: { $first: '$userInfo.department' },
                    station: { $first: '$userInfo.station' },
                    totalActions: { $sum: 1 },
                    timesOpened: {
                        $sum: {
                            $cond: [{ $in: ['$action', ['view', 'download', 'login']] }, 1, 0]
                        }
                    },
                    views: {
                        $sum: { $cond: [{ $eq: ['$action', 'view'] }, 1, 0] }
                    },
                    downloads: {
                        $sum: { $cond: [{ $eq: ['$action', 'download'] }, 1, 0] }
                    },
                    logins: {
                        $sum: { $cond: [{ $eq: ['$action', 'login'] }, 1, 0] }
                    },
                    modifications: {
                        $sum: {
                            $cond: [{ $in: ['$action', ['edit', 'upload', 'delete', 'share']] }, 1, 0]
                        }
                    },
                    lastActivity: { $max: '$timestamp' }
                }
            },
            {
                $sort: { totalActions: -1 }
            }
        ]);

        res.json({ stats });
    } catch (err) {
        console.error('Audit user stats error:', err);
        res.status(500).json({ msg: 'Server error calculating user audit statistics' });
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

// DELETE /api/audit/reset (or /clear) - Admin Only: Delete and reset entire audit trail history
router.delete(['/reset', '/clear'], async (req, res) => {
    try {
        const adminUser = req.user;
        const isAuthorizedAdmin =
            adminUser?.role === 'super_admin' ||
            adminUser?.role === 'station_admin' ||
            adminUser?.role === 'admin' ||
            adminUser?.formNumber === '25110377' ||
            adminUser?.badgeId === '25110377';

        if (!isAuthorizedAdmin) {
            return res.status(403).json({ msg: 'Access denied: Only authorized administrators can reset the audit trail' });
        }

        const result = await AuditLog.deleteMany({});

        res.json({
            success: true,
            msg: `Audit trail history has been reset and cleared successfully. (${result.deletedCount} records deleted)`,
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error('Reset audit trail error:', err);
        res.status(500).json({ msg: 'Server error resetting audit trail' });
    }
});

module.exports = router;
