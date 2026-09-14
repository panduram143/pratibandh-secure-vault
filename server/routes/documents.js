const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const Case = require('../models/Case');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { logAction } = require('../middleware/auditLogger');
const { encryptFile, decryptFile } = require('../utils/encryption');

// multer config
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.tiff', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// all routes protected
router.use(auth);

// GET /api/documents/search
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ msg: 'Search query is required' });

        const docs = await Document.find({
            $text: { $search: q }
        }).populate('case', 'caseId title')
          .populate('uploadedBy', 'name')
          .limit(20);

        res.json(docs);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// POST /api/documents/upload
router.post('/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const { title, docType, caseId, tags, accessRestriction, ocrText } = req.body;

        if (!caseId) {
            return res.status(400).json({ msg: 'Case ID is required' });
        }

        // verify case exists
        const caseDoc = await Case.findById(caseId);
        if (!caseDoc) {
            // clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ msg: 'Case not found' });
        }

        let filePath = req.file.path;
        let encrypted = false;

        // encrypt the file
        try {
            const encryptedPath = req.file.path + '.enc';
            await encryptFile(req.file.path, encryptedPath);
            // delete original unencrypted file
            fs.unlinkSync(req.file.path);
            filePath = encryptedPath;
            encrypted = true;
        } catch (encErr) {
            console.error('Encryption failed, storing unencrypted:', encErr.message);
            encrypted = false;
        }

        const doc = new Document({
            title: title || req.file.originalname,
            docType: docType || 'other',
            case: caseId,
            filePath,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            isEncrypted: encrypted,
            uploadedBy: req.user._id,
            tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : [],
            ocrText: ocrText || '',
            accessRestriction: accessRestriction || 'restricted'
        });

        await doc.save();
        await logAction(req.user._id, 'upload', 'document', doc.docId, `Uploaded: ${doc.originalName}`, req);

        res.status(201).json(doc);
    } catch (err) {
        console.error('Error uploading document:', err);
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch(e) {}
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message, errors: err.errors });
        }
        res.status(500).json({ msg: err.message || 'Server error' });
    }
});

// GET /api/documents
router.get('/', async (req, res) => {
    try {
        const { docType, caseId, accessRestriction, page = 1, limit = 20 } = req.query;

        let filter = {};
        if (docType) filter.docType = docType;
        if (caseId) filter.case = caseId;
        if (accessRestriction) filter.accessRestriction = accessRestriction;

        const docs = await Document.find(filter)
            .populate('case', 'caseId title')
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Document.countDocuments(filter);

        res.json({
            documents: docs,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/documents/:id
router.get('/:id', async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id)
            .populate('case', 'caseId title status')
            .populate('uploadedBy', 'name email');

        if (!doc) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        await logAction(req.user._id, 'view', 'document', doc.docId, 'Viewed document', req);

        res.json({ document: doc });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/documents/:id/download
router.get('/:id/download', async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        let downloadPath = doc.filePath;

        if (doc.isEncrypted) {
            // decrypt to temp file
            const tempPath = doc.filePath.replace('.enc', '.tmp');
            await decryptFile(doc.filePath, tempPath);
            downloadPath = tempPath;

            // send and cleanup
            res.download(downloadPath, doc.originalName, async (err) => {
                // cleanup temp file
                try { fs.unlinkSync(tempPath); } catch(e) {}
                if (err && !res.headersSent) {
                    res.status(500).json({ msg: 'Download failed' });
                }
            });
        } else {
            res.download(downloadPath, doc.originalName);
        }

        await logAction(req.user._id, 'download', 'document', doc.docId, `Downloaded: ${doc.originalName}`, req);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// DELETE /api/documents/:id  (only uploader or super_admin can delete)
router.delete('/:id', async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        // Check if user is the uploader or super_admin
        const isOwner = doc.uploadedBy && doc.uploadedBy.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'super_admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ msg: 'Unauthorized: You can only delete files uploaded by yourself' });
        }

        // delete file from disk
        try {
            if (doc.filePath && fs.existsSync(doc.filePath)) {
                fs.unlinkSync(doc.filePath);
            }
        } catch (e) {
            console.error('Failed to delete file from disk:', e.message);
        }

        await Document.findByIdAndDelete(req.params.id);
        await logAction(req.user._id, 'delete', 'document', doc.docId, `Deleted: ${doc.originalName || doc.title}`, req);

        res.json({ msg: 'Document deleted successfully' });
    } catch (err) {
        console.error('Error deleting document:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
