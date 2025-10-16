const express = require("express");
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getMe,
    updateUserProfile,
} = require("../Controllers/userController");
const { protect } = require("../Middleware/authMiddleware");

// Public routes (no authentication needed)
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// Protected routes (authentication needed)
// The 'protect' middleware runs first, verifies the token, and attaches the user ID to the request.
// router.get("/profile", protect, getProfile); // Example of a protected route

// Route to check if the user is currently logged in
router.get("/me", getMe);

router.put("/profile", protect, updateUserProfile); // To update user data
router.get("/profile", protect, (req, res) => { // To fetch user data
    // The 'protect' middleware already attaches the user object (req.user)
    res.json({ user: req.user });
});


module.exports = router;
