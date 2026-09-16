const router = require('express').Router();
const Case = require('../models/Case');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

// All search routes require authentication
router.use(auth);

// Helper to safely escape regex characters
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// GET /api/search
// Query params: q (required), type (all|cases|documents), crimeType, docType, status, station, limit
router.get('/', async (req, res) => {
    try {
        const {
            q = '',
            type = 'all',
            crimeType,
            docType,
            status,
            station,
            limit = 30
        } = req.query;

        const trimmedQ = q.trim();
        const searchLimit = Math.min(parseInt(limit, 10) || 30, 100);

        let results = {
            cases: [],
            documents: [],
            totalCases: 0,
            totalDocuments: 0
        };

        // If no query string and no specific filters provided, return empty or recent
        if (!trimmedQ && !crimeType && !docType && !status && !station) {
            return res.json({ results });
        }

        const regex = trimmedQ ? new RegExp(escapeRegex(trimmedQ), 'i') : null;

        // ----------------------------------------------------
        // 1. FORENSIC SEARCH: CASES
        // ----------------------------------------------------
        if (type === 'all' || type === 'cases') {
            const caseConditions = [];

            if (regex) {
                caseConditions.push({
                    $or: [
                        { caseId: regex },
                        { title: regex },
                        { description: regex },
                        { crimeType: regex },
                        { status: regex },
                        { station: regex },
                        { courtName: regex },
                        { judge: regex },
                        { 'suspect.name': regex },
                        { 'suspects.name': regex },
                        { 'victim.name': regex },
                        { 'victims.name': regex }
                    ]
                });
            }

            if (crimeType && crimeType !== 'all') {
                caseConditions.push({ crimeType });
            }
            if (status && status !== 'all') {
                caseConditions.push({ status });
            }
            if (station) {
                caseConditions.push({ station: new RegExp(escapeRegex(station), 'i') });
            }

            const caseQuery = caseConditions.length > 0 ? { $and: caseConditions } : {};

            const [caseDocs, totalCasesCount] = await Promise.all([
                Case.find(caseQuery)
                    .populate('createdBy', 'name formNumber badgeId station role')
                    .populate('assignedOfficers', 'name formNumber badgeId station')
                    .sort({ updatedAt: -1, createdAt: -1 })
                    .limit(searchLimit)
                    .lean(),
                Case.countDocuments(caseQuery)
            ]);

            results.cases = caseDocs;
            results.totalCases = totalCasesCount;
        }

        // ----------------------------------------------------
        // 2. FORENSIC SEARCH: DOCUMENTS & OCR ARTIFACTS
        // ----------------------------------------------------
        if (type === 'all' || type === 'documents') {
            const docConditions = [];

            if (regex) {
                docConditions.push({
                    $or: [
                        { docId: regex },
                        { title: regex },
                        { originalName: regex },
                        { docType: regex },
                        { tags: regex },
                        { ocrText: regex },
                        { accessRestriction: regex }
                    ]
                });
            }

            if (docType && docType !== 'all') {
                docConditions.push({ docType });
            }

            const docQuery = docConditions.length > 0 ? { $and: docConditions } : {};

            const [docArtifacts, totalDocsCount] = await Promise.all([
                Document.find(docQuery)
                    .populate('case', 'caseId title station crimeType status')
                    .populate('uploadedBy', 'name formNumber badgeId station role')
                    .sort({ updatedAt: -1, createdAt: -1 })
                    .limit(searchLimit)
                    .lean(),
                Document.countDocuments(docQuery)
            ]);

            // Add snippet preview for OCR text if matched
            if (trimmedQ) {
                const searchLower = trimmedQ.toLowerCase();
                docArtifacts.forEach((doc) => {
                    if (doc.ocrText && doc.ocrText.toLowerCase().includes(searchLower)) {
                        const index = doc.ocrText.toLowerCase().indexOf(searchLower);
                        const start = Math.max(0, index - 60);
                        const end = Math.min(doc.ocrText.length, index + searchLower.length + 80);
                        doc.ocrSnippet = (start > 0 ? '...' : '') + doc.ocrText.substring(start, end).trim() + (end < doc.ocrText.length ? '...' : '');
                    }
                });
            }

            results.documents = docArtifacts;
            results.totalDocuments = totalDocsCount;
        }

        res.json({
            results,
            query: trimmedQ,
            totalFound: (results.totalCases || 0) + (results.totalDocuments || 0)
        });
    } catch (err) {
        console.error('Forensic Search Error:', err);
        res.status(500).json({ msg: 'Server error during forensic search', error: err.message });
    }
});

module.exports = router;
