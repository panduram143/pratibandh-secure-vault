const AuditLog = require('../models/AuditLog');

const logAction = async (userId, action, resourceType, resourceId, details, req) => {
    try {
        const logEntry = new AuditLog({
            user: userId,
            action,
            resourceType,
            resourceId: resourceId || null,
            details: details || '',
            ipAddress: req ? (req.ip || req.connection.remoteAddress) : 'unknown',
            userAgent: req ? req.get('User-Agent') : 'unknown'
        });

        await logEntry.save();
    } catch (err) {
        // dont crash the app if audit logging fails, just log it
        console.error('Audit log error:', err.message);
    }
};

module.exports = { logAction };
