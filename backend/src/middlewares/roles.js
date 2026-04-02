const AppError = require('../utils/AppError');

const ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
};

const ROLE_HIERARCHY = {
  OWNER: 3,
  MANAGER: 2,
  MEMBER: 1,
};

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('Authentication required', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}

function requireMinRole(minRole) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('Authentication required', 401));
    }
    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
    if (userLevel < requiredLevel) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}

module.exports = { requireRole, requireMinRole, ROLES, ROLE_HIERARCHY };
