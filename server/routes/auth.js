const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RegisteredID = require('../models/RegisteredID');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { logAction } = require('../middleware/auditLogger');

// generate jwt token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Calculate Euclidean distance between two 128-d face descriptors
function calculateEuclideanDistance(desc1, desc2) {
    if (!desc1 || !desc2 || desc1.length !== 128 || desc2.length !== 128) {
        return Infinity;
    }
    let sum = 0;
    for (let i = 0; i < 128; i++) {
        const diff = desc1[i] - desc2[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

// POST /api/auth/match-id-card (AUTO-MATCH SCANNED ID CARD AGAINST REGISTERED DATABASE)
router.post('/match-id-card', async (req, res) => {
    try {
        const { formNumber, cardFaceDescriptor, extractedName } = req.body;

        const activeCards = await RegisteredID.find({ isActive: true });
        if (!activeCards || activeCards.length === 0) {
            return res.status(404).json({
                matched: false,
                msg: 'No registered ID cards in database. Please register personnel first.'
            });
        }

        // 1. Try matching by exact Form / Regd Number first if detected
        if (formNumber) {
            const cleanForm = formNumber.trim().toUpperCase();
            const foundByForm = activeCards.find(c =>
                c.formNumber.toUpperCase() === cleanForm ||
                cleanForm.includes(c.formNumber.toUpperCase()) ||
                c.formNumber.toUpperCase().includes(cleanForm)
            );

            if (foundByForm) {
                return res.json({
                    matched: true,
                    matchMethod: 'formNumber',
                    confidenceScore: 99,
                    personnel: {
                        id: foundByForm._id,
                        formNumber: foundByForm.formNumber,
                        name: foundByForm.name,
                        email: foundByForm.email,
                        role: foundByForm.role,
                        station: foundByForm.station,
                        department: foundByForm.department
                    }
                });
            }
        }

        // 2. Try biometric visual matching via ID card face descriptor
        let parsedDescriptor = cardFaceDescriptor;
        if (typeof cardFaceDescriptor === 'string') {
            try {
                parsedDescriptor = JSON.parse(cardFaceDescriptor);
            } catch (e) {
                parsedDescriptor = null;
            }
        }

        if (Array.isArray(parsedDescriptor) && parsedDescriptor.length === 128) {
            let bestCard = null;
            let minDistance = Infinity;

            for (const card of activeCards) {
                if (card.faceDescriptor && card.faceDescriptor.length === 128) {
                    const dist = calculateEuclideanDistance(parsedDescriptor, card.faceDescriptor);
                    if (dist < minDistance) {
                        minDistance = dist;
                        bestCard = card;
                    }
                }
            }

            const MATCH_THRESHOLD = 0.58;
            if (bestCard && minDistance <= MATCH_THRESHOLD) {
                const confidence = Math.round(Math.max(0, 1 - minDistance) * 100);
                return res.json({
                    matched: true,
                    matchMethod: 'biometric_portrait',
                    distance: minDistance.toFixed(4),
                    confidenceScore: confidence,
                    personnel: {
                        id: bestCard._id,
                        formNumber: bestCard.formNumber,
                        name: bestCard.name,
                        email: bestCard.email,
                        role: bestCard.role,
                        station: bestCard.station,
                        department: bestCard.department
                    }
                });
            }
        }

        // 3. Fallback: Try fuzzy matching by extracted name
        if (extractedName && extractedName.trim().length > 3) {
            const cleanName = extractedName.trim().toLowerCase();
            const foundByName = activeCards.find(c =>
                c.name.toLowerCase().includes(cleanName) ||
                cleanName.includes(c.name.toLowerCase())
            );

            if (foundByName) {
                return res.json({
                    matched: true,
                    matchMethod: 'name_match',
                    confidenceScore: 85,
                    personnel: {
                        id: foundByName._id,
                        formNumber: foundByName.formNumber,
                        name: foundByName.name,
                        email: foundByName.email,
                        role: foundByName.role,
                        station: foundByName.station,
                        department: foundByName.department
                    }
                });
            }
        }

        return res.status(404).json({
            matched: false,
            msg: 'ID Card could not be matched with any registered record in the system.'
        });
    } catch (err) {
        console.error('Match ID Card error:', err);
        res.status(500).json({ msg: 'Server error matching ID card' });
    }
});

// POST /api/auth/face-login (PRIMARY AI BIOMETRIC LOGIN)
router.post('/face-login', async (req, res) => {
    try {
        const { formNumber, faceDescriptor } = req.body;

        if (!formNumber || !faceDescriptor) {
            return res.status(400).json({ msg: 'Form number and live face descriptor are required' });
        }

        let parsedDescriptor = faceDescriptor;
        if (typeof faceDescriptor === 'string') {
            try {
                parsedDescriptor = JSON.parse(faceDescriptor);
            } catch (e) {
                return res.status(400).json({ msg: 'Invalid face descriptor format' });
            }
        }

        if (!Array.isArray(parsedDescriptor) || parsedDescriptor.length !== 128) {
            return res.status(400).json({ msg: 'Face descriptor must be a 128-dimensional vector' });
        }

        const formattedFormNo = formNumber.trim().toUpperCase();

        // 1. Look up the registered personnel record by Form Number
        const registered = await RegisteredID.findOne({
            formNumber: formattedFormNo,
            isActive: true
        });

        if (!registered) {
            return res.status(404).json({
                msg: 'ID Card (Form No) not found in system or deactivated by admin'
            });
        }

        // 2. Compute Euclidean distance between live face and registered ID card face
        const distance = calculateEuclideanDistance(parsedDescriptor, registered.faceDescriptor);
        const MATCH_THRESHOLD = 0.60; // Standard threshold for face-api.js

        console.log(`[Face-Auth] Form No: ${formattedFormNo}, Distance: ${distance.toFixed(4)}, Threshold: ${MATCH_THRESHOLD}`);

        if (distance > MATCH_THRESHOLD) {
            // Log failed biometric attempt
            return res.status(401).json({
                msg: `Face verification failed. Live face does not match ID card photo (Confidence score: ${(Math.max(0, 1 - distance) * 100).toFixed(1)}%)`,
                distance: distance.toFixed(4)
            });
        }

        // 3. Find or sync User account (Ensure 25110377 is super_admin)
        const assignedRole = (formattedFormNo === '25110377') ? 'super_admin' : (registered.role || 'officer');

        let user = await User.findOne({
            $or: [
                { formNumber: formattedFormNo },
                { email: registered.email.toLowerCase() }
            ]
        });

        if (!user) {
            user = new User({
                name: registered.name,
                email: registered.email,
                role: assignedRole,
                station: registered.station,
                department: registered.department,
                phone: registered.phone,
                formNumber: formattedFormNo,
                isActive: true
            });
            await user.save();
        } else {
            // Update latest sync from registered ID
            user.formNumber = formattedFormNo;
            user.role = assignedRole;
            user.station = registered.station;
            user.department = registered.department;
            user.phone = registered.phone;
            user.isActive = true;
            user.lastLogin = new Date();
            await user.save();
        }

        // 4. Log audit trail
        await logAction(
            user._id,
            'login',
            'system',
            user._id,
            `AI ID + Face Verification Login (Form No: ${formattedFormNo}, Match distance: ${distance.toFixed(4)})`,
            req
        );

        // 5. Generate JWT token
        const token = generateToken(user._id);

        res.json({
            token,
            matchScore: ((1 - Math.min(distance, 1)) * 100).toFixed(1) + '%',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                station: user.station,
                department: user.department,
                formNumber: user.formNumber
            }
        });
    } catch (err) {
        console.error('Face login error:', err);
        res.status(500).json({ msg: 'Server error during biometric authentication' });
    }
});

// POST /api/auth/login (Password Login for existing/seeded users)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ msg: 'Please provide email and password' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ msg: 'Account is deactivated. Contact admin.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // update last login
        user.lastLogin = new Date();
        await user.save();

        // audit log
        await logAction(user._id, 'login', 'system', null, 'User logged in with password', req);

        const token = generateToken(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                station: user.station,
                department: user.department,
                formNumber: user.formNumber
            }
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// POST /api/auth/register (Restricted: only super_admin can call)
router.post('/register', auth, roleCheck(['super_admin']), async (req, res) => {
    try {
        const { name, email, password, role, station, formNumber, badgeId, department, phone } = req.body;

        // check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists with this email' });
        }

        const formNoToUse = formNumber || badgeId;
        if (formNoToUse) {
            const formExists = await User.findOne({
                $or: [{ formNumber: formNoToUse }, { badgeId: formNoToUse }]
            });
            if (formExists) {
                return res.status(400).json({ msg: 'Form number already registered' });
            }
        }

        user = new User({
            name,
            email,
            password,
            role,
            station,
            formNumber: formNoToUse,
            badgeId: formNoToUse,
            department,
            phone
        });

        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                station: user.station,
                formNumber: user.formNumber
            }
        });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// PUT /api/auth/me
router.put('/me', auth, async (req, res) => {
    try {
        const updates = {};
        const allowedFields = ['name', 'phone', 'department', 'station'];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
