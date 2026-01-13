const asyncHandler = require("express-async-handler");
const Review = require("../Models/review");
const User = require("../Models/userModel");

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({})
        .populate('user', 'name email')
        .sort({ createdAt: -1 });

    res.json(reviews);
});

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
    const { name, rating, comment } = req.body;

    // Validate input
    if (!name || !rating || !comment) {
        res.status(400);
        throw new Error("Please provide all required fields");
    }

    if (rating < 1 || rating > 5) {
        res.status(400);
        throw new Error("Rating must be between 1 and 5");
    }

    if (comment.length < 10) {
        res.status(400);
        throw new Error("Comment must be at least 10 characters long");
    }

    // Create review
    const review = await Review.create({
        user: req.user._id,
        name: name.trim(),
        rating: parseInt(rating),
        comment: comment.trim()
    });

    // Populate user info for response
    const populatedReview = await Review.findById(review._id)
        .populate('user', 'name email');

    res.status(201).json(populatedReview);
});

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
    const { name, rating, comment } = req.body;
    const reviewId = req.params.id;

    // Find the review
    const review = await Review.findById(reviewId);

    if (!review) {
        res.status(404);
        throw new Error("Review not found");
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorized to update this review");
    }

    // Validate input
    if (!name || !rating || !comment) {
        res.status(400);
        throw new Error("Please provide all required fields");
    }

    if (rating < 1 || rating > 5) {
        res.status(400);
        throw new Error("Rating must be between 1 and 5");
    }

    if (comment.length < 10) {
        res.status(400);
        throw new Error("Comment must be at least 10 characters long");
    }

    // Update review
    review.name = name.trim();
    review.rating = parseInt(rating);
    review.comment = comment.trim();
    review.updatedAt = Date.now();

    const updatedReview = await review.save();

    // Populate user info for response
    const populatedReview = await Review.findById(updatedReview._id)
        .populate('user', 'name email');

    res.json(populatedReview);
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
    const reviewId = req.params.id;

    // Find the review
    const review = await Review.findById(reviewId);

    if (!review) {
        res.status(404);
        throw new Error("Review not found");
    }

    // Check if user owns this review or is admin
    if (review.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(403);
        throw new Error("Not authorized to delete this review");
    }

    await Review.deleteOne({ _id: reviewId });

    res.json({ message: "Review deleted successfully" });
});

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
const getMyReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({ user: req.user._id })
        .sort({ createdAt: -1 });

    res.json(reviews);
});

module.exports = {
    getReviews,
    createReview,
    updateReview,
    deleteReview,
    getMyReviews
};
