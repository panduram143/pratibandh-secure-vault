const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const RegisteredID = require('../models/RegisteredID');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { logAction } = require('../middleware/auditLogger');
const { encryptFile, decryptFile } = require('../utils/encryption');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/idcards');
if (!fsSync.existsSync(uploadDir)) {
    fsSync.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage for ID card images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'idcard-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files (JPG, PNG, WebP) are allowed for ID cards'));
    }
});

// Pre-defined Sample OUTR Cards
const SAMPLE_RECORDS = [
    { formNumber: '25110377', name: 'Soyam Prakash Panda', email: 'soyam.25110377@outr.ac.in', role: 'super_admin', department: 'Computer Science and Engineering', station: 'OUTR Bhubaneswar' },
    { formNumber: '25110335', name: 'Chitra Adyasha Panda', email: 'chitra.25110335@outr.ac.in', role: 'officer', department: 'Computer Science and Engineering', station: 'OUTR Bhubaneswar' },
    { formNumber: '25110367', name: 'S Kuldeep', email: 'kuldeep.25110367@outr.ac.in', role: 'officer', department: 'Computer Science and Engineering', station: 'OUTR Bhubaneswar' },
    { formNumber: '25110378', name: 'Soyam Sambit Sahoo', email: 'soyam_sambit.25110378@outr.ac.in', role: 'officer', department: 'Computer Science and Engineering', station: 'OUTR Bhubaneswar' }
];

// GET /api/registered-ids/verify/:formNumber (PUBLIC for Login Step 1)
router.get('/verify/:formNumber', async (req, res) => {
    try {
        const { formNumber } = req.params;
        if (!formNumber) {
            return res.status(400).json({ msg: 'Form number is required' });
        }

        const cleanForm = formNumber.trim().toUpperCase();
        const digitsMatch = cleanForm.match(/\d{6,10}/);
        const digits = digitsMatch ? digitsMatch[0] : null;

        let registered = await RegisteredID.findOne({
            $or: [
                { formNumber: cleanForm },
                ...(digits ? [{ formNumber: new RegExp(digits, 'i') }] : [])
            ],
            isActive: true
        }).select('formNumber name role station department faceDescriptor');

        if (!registered) {
            const sample = SAMPLE_RECORDS.find(s => s.formNumber === cleanForm || (digits && s.formNumber === digits));
            if (sample) {
                registered = new RegisteredID({
                    formNumber: sample.formNumber,
                    name: sample.name,
                    email: sample.email,
                    role: sample.role,
                    station: sample.station,
                    department: sample.department,
                    phone: '+91 9876543210',
                    idCardImage: `sample_ids/${sample.formNumber}.jpeg`,
                    isActive: true
                });
                await registered.save();
            }
        }

        if (!registered) {
            return res.status(404).json({
                exists: false,
                msg: 'Form number not registered in system or deactivated'
            });
        }

        res.json({
            exists: true,
            personnel: {
                formNumber: registered.formNumber,
                name: registered.name,
                role: registered.role,
                station: registered.station,
                department: registered.department
            }
        });
    } catch (err) {
        console.error('Verify form number error:', err);
        res.status(500).json({ msg: 'Server error during ID verification' });
    }
});

// POST /api/registered-ids/seed-samples (Initialize or update sample ID cards with biometric descriptors)
router.post('/seed-samples', async (req, res) => {
    try {
        const { samples } = req.body;
        if (!Array.isArray(samples) || samples.length === 0) {
            return res.status(400).json({ msg: 'Samples array required' });
        }

        const results = [];
        for (const item of samples) {
            const { formNumber, name, email, role, station, department, phone, faceDescriptor, idCardImage } = item;

            if (!formNumber || !name || !email || !faceDescriptor) continue;

            const formattedForm = formNumber.trim().toUpperCase();
            let parsedDescriptor = faceDescriptor;
            if (typeof faceDescriptor === 'string') {
                try { parsedDescriptor = JSON.parse(faceDescriptor); } catch (e) {}
            }

            if (!Array.isArray(parsedDescriptor) || parsedDescriptor.length !== 128) continue;

            let existing = await RegisteredID.findOne({ formNumber: formattedForm });
            if (!existing) {
                existing = new RegisteredID({
                    formNumber: formattedForm,
                    name: name.trim(),
                    email: email.toLowerCase().trim(),
                    role: role || 'officer',
                    station: station || 'Odisha University of Technology and Research (OUTR)',
                    department: department || 'Computer Science and Engineering',
                    phone: phone || '+91 9876543210',
                    idCardImage: idCardImage || 'sample_ids/' + formattedForm + '.jpeg',
                    faceDescriptor: parsedDescriptor,
                    addedBy: '000000000000000000000000',
                    isActive: true
                });
                await existing.save();
            } else {
                existing.faceDescriptor = parsedDescriptor;
                existing.name = name.trim();
                existing.isActive = true;
                await existing.save();
            }

            // Sync User record
            let user = await User.findOne({ email: email.toLowerCase().trim() });
            if (!user) {
                user = new User({
                    name: name.trim(),
                    email: email.toLowerCase().trim(),
                    role: role || 'officer',
                    station: station || 'Odisha University of Technology and Research (OUTR)',
                    department: department || 'Computer Science and Engineering',
                    formNumber: formattedForm,
                    badgeId: formattedForm,
                    phone: phone || '+91 9876543210',
                    isActive: true
                });
                await user.save();
            } else {
                user.formNumber = formattedForm;
                user.name = name.trim();
                user.isActive = true;
                await user.save();
            }

            results.push({ formNumber: formattedForm, name: name.trim(), status: 'synced' });
        }

        res.json({ msg: 'Sample ID cards synced successfully', count: results.length, results });
    } catch (err) {
        console.error('Seed samples error:', err);
        res.status(500).json({ msg: 'Server error seeding sample IDs', error: err.message });
    }
});

// GET /api/registered-ids/sample-status (Check count of registered IDs in DB)
router.get('/sample-status', async (req, res) => {
    try {
        const count = await RegisteredID.countDocuments({ isActive: true });
        const items = await RegisteredID.find({ isActive: true }).select('formNumber name role station department');
        res.json({ count, items });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Apply admin auth for all subsequent endpoints
router.use(auth);
router.use(roleCheck(['super_admin', 'station_admin']));

// POST /api/registered-ids (Register new personnel with ID card)
router.post('/', upload.single('idCard'), async (req, res) => {
    let rawFilePath = null;
    try {
        const { formNumber, name, email, role, station, department, phone, faceDescriptor } = req.body;

        if (!formNumber || !name || !email) {
            return res.status(400).json({ msg: 'Form number, name, and email are required' });
        }

        if (!req.file) {
            return res.status(400).json({ msg: 'Physical ID card image is required' });
        }

        rawFilePath = req.file.path;

        // Parse face descriptor
        let parsedDescriptor;
        try {
            parsedDescriptor = typeof faceDescriptor === 'string' ? JSON.parse(faceDescriptor) : faceDescriptor;
        } catch (e) {
            return res.status(400).json({ msg: 'Invalid face descriptor format. Must be JSON array.' });
        }

        if (!Array.isArray(parsedDescriptor) || parsedDescriptor.length !== 128) {
            return res.status(400).json({ msg: 'Face descriptor must be a 128-dimensional array' });
        }

        const formattedFormNo = formNumber.trim().toUpperCase();

        // Check for duplicates
        const existingForm = await RegisteredID.findOne({ formNumber: formattedFormNo });
        if (existingForm) {
            return res.status(400).json({ msg: `Form number ${formattedFormNo} is already registered` });
        }

        const existingEmail = await RegisteredID.findOne({ email: email.toLowerCase().trim() });
        if (existingEmail) {
            return res.status(400).json({ msg: 'Email is already registered' });
        }

        // Encrypt the ID card image
        const encryptedPath = rawFilePath + '.enc';
        await encryptFile(rawFilePath, encryptedPath);
        // Delete original unencrypted temp file
        await fs.unlink(rawFilePath).catch(() => {});
        rawFilePath = null;

        // Create RegisteredID
        const newRegisteredID = new RegisteredID({
            formNumber: formattedFormNo,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            role: role || 'officer',
            station: station ? station.trim() : '',
            department: department ? department.trim() : '',
            phone: phone ? phone.trim() : '',
            idCardImage: encryptedPath,
            faceDescriptor: parsedDescriptor,
            addedBy: req.user._id,
            isActive: true
        });

        await newRegisteredID.save();

        // Sync or create corresponding User account
        let user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            user = new User({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                role: role || 'officer',
                station: station ? station.trim() : '',
                department: department ? department.trim() : '',
                phone: phone ? phone.trim() : '',
                formNumber: formattedFormNo,
                isActive: true
            });
            await user.save();
        } else {
            user.formNumber = formattedFormNo;
            user.role = role || user.role;
            user.station = station || user.station;
            user.department = department || user.department;
            user.phone = phone || user.phone;
            user.isActive = true;
            await user.save();
        }

        await logAction(
            req.user._id,
            'upload',
            'user',
            newRegisteredID._id,
            `Registered ID card for ${name.trim()} (Form No: ${formattedFormNo})`,
            req
        );

        res.status(201).json({
            msg: 'Personnel registered successfully with ID card and face biometric',
            registered: {
                _id: newRegisteredID._id,
                formNumber: newRegisteredID.formNumber,
                name: newRegisteredID.name,
                email: newRegisteredID.email,
                role: newRegisteredID.role,
                station: newRegisteredID.station,
                department: newRegisteredID.department,
                phone: newRegisteredID.phone,
                isActive: newRegisteredID.isActive,
                createdAt: newRegisteredID.createdAt
            }
        });
    } catch (err) {
        console.error('Register ID card error:', err);
        if (rawFilePath) {
            await fs.unlink(rawFilePath).catch(() => {});
        }
        res.status(500).json({ msg: err.message || 'Server error registering ID' });
    }
});

// GET /api/registered-ids (List all personnel)
router.get('/', async (req, res) => {
    try {
        const { search, role, station, status, page = 1, limit = 20 } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { formNumber: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) query.role = role;
        if (station) query.station = { $regex: station, $options: 'i' };
        if (status !== undefined && status !== '') {
            query.isActive = status === 'active';
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [items, total] = await Promise.all([
            RegisteredID.find(query)
                .select('-faceDescriptor')
                .populate('addedBy', 'name email formNumber')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            RegisteredID.countDocuments(query)
        ]);

        res.json({
            items,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        console.error('Fetch registered IDs error:', err);
        res.status(500).json({ msg: 'Server error fetching personnel list' });
    }
});

// GET /api/registered-ids/:id (Get single personnel)
router.get('/:id', async (req, res) => {
    try {
        const item = await RegisteredID.findById(req.params.id)
            .select('-faceDescriptor')
            .populate('addedBy', 'name email formNumber');

        if (!item) {
            return res.status(404).json({ msg: 'Personnel record not found' });
        }

        res.json(item);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// PUT /api/registered-ids/:id (Update personnel metadata)
router.put('/:id', async (req, res) => {
    try {
        const { name, role, station, department, phone, isActive } = req.body;

        const registered = await RegisteredID.findById(req.params.id);
        if (!registered) {
            return res.status(404).json({ msg: 'Personnel record not found' });
        }

        if (name !== undefined) registered.name = name.trim();
        if (role !== undefined) registered.role = role;
        if (station !== undefined) registered.station = station.trim();
        if (department !== undefined) registered.department = department.trim();
        if (phone !== undefined) registered.phone = phone.trim();
        if (isActive !== undefined) registered.isActive = isActive;

        await registered.save();

        // Also update matching user
        await User.findOneAndUpdate(
            { email: registered.email },
            {
                $set: {
                    name: registered.name,
                    role: registered.role,
                    station: registered.station,
                    department: registered.department,
                    phone: registered.phone,
                    isActive: registered.isActive
                }
            }
        );

        await logAction(
            req.user._id,
            'edit',
            'user',
            registered._id,
            `Updated personnel record for ${registered.name} (${registered.formNumber})`,
            req
        );

        res.json({ msg: 'Personnel updated successfully', registered });
    } catch (err) {
        console.error('Update personnel error:', err);
        res.status(500).json({ msg: 'Server error updating personnel' });
    }
});

// DELETE /api/registered-ids/:id (Soft-deactivate personnel)
router.delete('/:id', async (req, res) => {
    try {
        const registered = await RegisteredID.findById(req.params.id);
        if (!registered) {
            return res.status(404).json({ msg: 'Personnel record not found' });
        }

        registered.isActive = false;
        await registered.save();

        // Deactivate User account too
        await User.findOneAndUpdate(
            { email: registered.email },
            { $set: { isActive: false } }
        );

        await logAction(
            req.user._id,
            'delete',
            'user',
            registered._id,
            `Deactivated personnel ${registered.name} (${registered.formNumber})`,
            req
        );

        res.json({ msg: 'Personnel deactivated successfully' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error deactivating personnel' });
    }
});

module.exports = router;
