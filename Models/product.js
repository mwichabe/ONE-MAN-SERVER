const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },

    name: {
        type: String,
        required: [true, 'Please add a product name'],
        trim: true,
        unique: true,
    },

    description: {
        type: String,
        required: [true, 'Please add a description'],
    },

    price: {
        type: Number,
        required: [true, 'Please add a price'],
        min: 0,
    },

    stock: {
        type: Number,
        required: [true, 'Please specify current stock quantity'],
        min: 0,
    },

    category: {
        type: String,
        required: [true, 'Please specify a category'],
    },
    imageUrls: {
        type: [String],
        default: ['https://placehold.co/600x400/000000/FFFFFF?text=Product+Image'],
    },

    sizes: {
        type: [String],
        default: [],
    },

}, {
    timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);
