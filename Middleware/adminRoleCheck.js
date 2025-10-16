const asyncHandler = require('express-async-handler');

/**
 * Middleware to check if the authenticated user has the 'admin' role.
 * This middleware MUST run *after* the 'protect' middleware, which attaches 
 * the authenticated user object to the request (req.user).
 */
const admin = asyncHandler(async (req, res, next) => {
    // Check 1: Ensure user data was attached by the 'protect' middleware
    if (!req.user) {
        // This case should ideally be caught by the 401 in 'protect', but acts as a guardrail.
        res.status(401);
        throw new Error('Not authorized. Authentication data is missing.');
    }
    
    // Check 2: Verify the user has the 'isAdmin' property set to true
    if (req.user.isAdmin) {
        next(); // User is an admin, proceed
    } else {
        // User is authenticated but does not have admin privileges
        res.status(403); // Forbidden status
        throw new Error('Access denied. Administrator privileges required.');
    }
});

module.exports = {
    admin
};