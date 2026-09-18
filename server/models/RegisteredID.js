const mongoose = require('mongoose');

const registeredIDSchema = new mongoose.Schema({
    formNumber: {
        type: String,
        required: [true, 'Form number is required'],
        unique: true,
        trim: true,
        uppercase: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Personnel name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['super_admin', 'station_admin', 'officer', 'court_official', 'forensic_expert', 'viewer'],
        default: 'officer'
    },
    station: {
        type: String,
        trim: true,
        default: 'OUTR Bhubaneswar'
    },
    department: {
        type: String,
        trim: true,
        default: 'Computer Science and Engineering'
    },
    phone: {
        type: String,
        trim: true,
        default: '+91 9876543210'
    },
    idCardImage: {
        type: String,
        required: false,
        default: null
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

registeredIDSchema.index({ name: 'text', formNumber: 'text', station: 'text' });

module.exports = mongoose.model('RegisteredID', registeredIDSchema);
