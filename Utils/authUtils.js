const jwt = require("jsonwebtoken");

// IMPORTANT: Use a complex, hidden secret in a production environment
const JWT_SECRET = "thisisoneman"; 

/**
 * Generates a JWT token for a given user ID.
 * @param {string} id - The MongoDB ObjectID of the user.
 * @returns {string} The signed JWT token.
 */
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: "30d",
    });
};

module.exports = {
    generateToken,
    JWT_SECRET,
};
