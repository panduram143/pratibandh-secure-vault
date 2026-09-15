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
        trim: true
    },
    department: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    idCardImage: {
        type: String,
        required: [true, 'ID card image path is required']
    },
    faceDescriptor: {
        type: [Number],
        required: [true, 'Face descriptor vector is required'],
        validate: {
            validator: function (v) {
                return Array.isArray(v) && v.length === 128;
            },
            message: 'Face descriptor must be a 128-dimensional vector'
        }
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
