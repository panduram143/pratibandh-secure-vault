const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        enum: ['login', 'logout', 'view', 'download', 'upload', 'edit', 'delete', 'share', 'print_attempt', 'screenshot_attempt', 'access_denied'],
        required: true
    },
    resourceType: {
        type: String,
        enum: ['document', 'case', 'user', 'system']
    },
    resourceId: String,
    details: String,
    ipAddress: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// index for faster queries
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ resourceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
