const router = require('express').Router();
const Case = require('../models/Case');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

// all routes need auth
router.use(auth);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        const totalCases = await Case.countDocuments();
        const openCases = await Case.countDocuments({ status: 'open' });
        const documents = await Document.countDocuments();
        const pendingReviews = await Case.countDocuments({ status: 'under_investigation' });

        res.json({
            totalCases,
            openCases,
            documents,
            pendingReviews
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
