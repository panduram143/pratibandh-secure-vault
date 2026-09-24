const mongoose = require("mongoose");

// generate case id like CASE-2024-00001
function generateCaseId() {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `CASE-${year}-${random}`;
}

const caseSchema = new mongoose.Schema({
    caseId: {
        type: String,
        required: true,
        unique: true,
        default: generateCaseId
    },
    title: {
        type: String,
        required: [true, 'Case title is required'],
        trim: true
    },
    description: String,
    crimeType: {
        type: String,
        enum: ['murder', 'rape', 'theft', 'cybercrime', 'fraud', 'kidnapping', 'assault', 'drug_trafficking', 'corruption', 'other'],
    },
    status: {
        type: String,
        enum: ['open', 'under_investigation', 'charge_sheeted', 'closed', 'reopened'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    suspect: {
        name: String,
        age: Number,
        gender: String,
        description: String
    },
    suspects: [{
        name: String,
        age: Number,
        gender: String,
        description: String
    }],
    victim: {
        name: String,
        age: Number,
        gender: String
    },
    victims: [{
        name: String,
        age: Number,
        gender: String
    }],
    assignedOfficers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // 3 Dedicated Spaces for Admitted Officers (confidential clearance to view victim identity)
    admittedOfficers: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        validate: [
            function(val) {
                return !val || val.length <= 3;
            },
            'A maximum of 3 admitted officers are allowed per case'
        ],
        default: []
    },
    station: String,
    filingDate: Date,
    courtName: String,
    judge: String,
    sharedWith: [{
        station: String,
        accessLevel: { type: String, default: 'read' },
        grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        grantedAt: { type: Date, default: Date.now }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, {
    timestamps: true // adds createdAt and updatedAt automatically
});

// text index for search
caseSchema.index({ title: 'text', description: 'text' });

// virtual for caseNumber alias
caseSchema.virtual('caseNumber').get(function() {
    return this.caseId;
});

caseSchema.set('toJSON', { virtuals: true });
caseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Case', caseSchema);
