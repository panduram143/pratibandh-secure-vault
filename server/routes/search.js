const router = require('express').Router();
const Case = require('../models/Case');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

// all routes need auth
router.use(auth);

// GET /api/search
router.get('/', async (req, res) => {
    try {
        const { q, type = 'all' } = req.query;

        if (!q) {
            return res.status(400).json({ msg: 'Search query is required' });
        }

        let results = {
            cases: [],
            documents: []
        };

        // Search cases
        if (type === 'all' || type === 'cases') {
            results.cases = await Case.find({
                $text: { $search: q }
            })
                .populate('createdBy', 'name email')
                .limit(20)
                .lean();
        }

        // Search documents
        if (type === 'all' || type === 'documents') {
            results.documents = await Document.find({
                $text: { $search: q }
            })
                .populate('case', 'caseId title')
                .populate('uploadedBy', 'name')
                .limit(20)
                .lean();
        }

        res.json({ results });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
