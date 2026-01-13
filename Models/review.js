const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better query performance
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ createdAt: -1 });

// If model already exists (cached), delete it to force reload
if (mongoose.models.Review) {
    delete mongoose.models.Review;
}

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
