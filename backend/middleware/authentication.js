const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'smartsurplus_super_secret_jwt_key_2026', (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    req.user = {
      ...decoded,
      id: decoded.userId || decoded.id,
      userId: decoded.userId || decoded.id
    };
    next();
  });
};

const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.'
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  allowRoles,
  authorizeRoles: allowRoles // Aliased for flexible imports
};
