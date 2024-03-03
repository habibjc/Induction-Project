  // middleware/author.js
const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
      const userRoles = req.user && req.user.roles ? req.user.roles.map(role => role.roleId) : [];
  
      // Check if any of the user roles match the allowed roles
      const intersection = allowedRoles.filter(role => userRoles.includes(role));
      if (intersection.length > 0) {
        // User has at least one allowed role
        next();
      } else {
        // User does not have any allowed roles
        return res.status(403).json({ error: 'Not Authorized on this Operation !!!!' });
      }
    };
  };
  
  export default authorizeRoles;
  