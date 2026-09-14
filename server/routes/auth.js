const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { logAction } = require('../middleware/auditLogger');

// generate jwt token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, station, badgeId, department, phone } = req.body;

        // check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists with this email' });
        }

        if (badgeId) {
            const badgeExists = await User.findOne({ badgeId });
            if (badgeExists) {
                return res.status(400).json({ msg: 'Badge ID already registered' });
            }
        }

        user = new User({
            name, email, password, role, station, badgeId, department, phone
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
                station: user.station
            }
        });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// POST /api/auth/login
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
        await logAction(user._id, 'login', 'system', null, 'User logged in', req);

        const token = generateToken(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                station: user.station,
                department: user.department
            }
        });
    } catch (err) {
        console.error('Login error:', err.message);
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
