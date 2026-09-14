// role based access control middleware
const roleCheck = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ msg: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                msg: 'Access denied. You do not have permission to perform this action.'
            });
        }

        next();
    };
};

module.exports = roleCheck;
