const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    role: {
        type: String,
        enum: ['super_admin', 'station_admin', 'officer', 'court_official', 'forensic_expert', 'viewer'],
        default: 'officer'
    },
    station: String, // police station name
    badgeId: {
        type: String,
        unique: true,
        sparse: true
    },
    department: String,
    phone: String,
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
