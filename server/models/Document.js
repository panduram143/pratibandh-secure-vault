const mongoose = require('mongoose');

function generateDocId() {
    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `DOC-${year}-${rand}`;
}

const documentSchema = new mongoose.Schema({
    docId: {
        type: String,
        required: true,
        unique: true,
        default: generateDocId
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    docType: {
        type: String,
        enum: ['fir', 'charge_sheet', 'evidence', 'investigation_report', 'court_filing', 'forensic_report', 'witness_statement', 'other']
    },
    case: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    originalName: String,
    mimeType: String,
    fileSize: Number,
    isEncrypted: {
        type: Boolean,
        default: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    tags: [String],
    ocrText: String,
    version: {
        type: Number,
        default: 1
    },
    previousVersions: [{
        filePath: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
        version: Number
    }],
    accessRestriction: {
        type: String,
        enum: ['public', 'restricted', 'confidential', 'top_secret'],
        default: 'restricted'
    }
}, {
    timestamps: true
});

documentSchema.index({ title: 'text', ocrText: 'text' });

module.exports = mongoose.model('Document', documentSchema);
