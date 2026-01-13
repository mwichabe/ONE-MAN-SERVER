const express = require("express");
const router = express.Router();
const {
    getReviews,
    createReview,
    updateReview,
    deleteReview,
    getMyReviews
} = require("../Controllers/reviewController");
const { protect } = require("../Middleware/authMiddleware");

// Public routes
router.get("/", getReviews);

// Protected routes
router.post("/", protect, createReview);
router.get("/my-reviews", protect, getMyReviews);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

module.exports = router;
