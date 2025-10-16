const asyncHandler = require('express-async-handler');
const Product = require('../Models/product');

/**
 * @desc    Get all products (Admin List)
 * @route   GET /api/admin/products
 * @access  Private (Admin Only)
 */
const getProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.status(200).json(products);
});

/**
 * @desc    Create a new product
 * @route   POST /api/admin/products
 * @access  Private (Admin Only)
 */
const createProduct = asyncHandler(async (req, res) => {
    const { name, description, price, stock, category, imageUrls, sizes } = req.body;

    // Validate required fields
    if (!name || !description || !price || !stock || !category) {
        res.status(400);
        throw new Error('Please include all required product fields.');
    }

    // Create the new product
    const product = await Product.create({
        user: req.user._id, // from the 'protect' middleware
        name,
        description,
        price,
        stock,
        category,
        sizes: Array.isArray(sizes) ? sizes : [],
        imageUrls:
            Array.isArray(imageUrls) && imageUrls.length > 0
                ? imageUrls
                : ['https://placehold.co/600x400/000000/FFFFFF?text=Product+Image'],
    });

    res.status(201).json(product);
});

/**
 * @desc    Update an existing product
 * @route   PUT /api/admin/products/:id
 * @access  Private (Admin Only)
 */
const updateProduct = asyncHandler(async (req, res) => {
    const { name, description, price, stock, category, imageUrls, sizes } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    // Update only the fields provided in the request
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price ?? product.price;
    product.stock = stock ?? product.stock;
    product.category = category || product.category;

    // Update arrays only if provided
    if (Array.isArray(sizes)) product.sizes = sizes;
    if (Array.isArray(imageUrls)) product.imageUrls = imageUrls;

    const updatedProduct = await product.save();

    res.status(200).json(updatedProduct);
});
/**
 * @desc    Get a single random product for the home page/discount showcase
 * @route   GET /api/products/random
 * @access  Public
 */
const getRandomProduct = asyncHandler(async (req, res) => {
    // 1. Get total number of documents
    const count = await Product.countDocuments();

    if (count === 0) {
        return res.status(200).json({ product: null, message: "No products found." });
    }

    // 2. Select a random index
    const random = Math.floor(Math.random() * count);

    // 3. Find one document, skipping the random number of documents
    const product = await Product.findOne().skip(random);

    if (!product) {
        // Fallback in case of race condition/deleted product
        return res.status(200).json({ product: null, message: "Could not retrieve a product." });
    }

    res.status(200).json(product);
});


/**
 * @desc    Delete a product
 * @route   DELETE /api/admin/products/:id
 * @access  Private (Admin Only)
 */
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    await product.deleteOne();

    res.status(200).json({ id: req.params.id, message: 'Product successfully removed.' });
});

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getRandomProduct
};
