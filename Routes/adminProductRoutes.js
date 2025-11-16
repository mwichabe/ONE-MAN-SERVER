const express = require('express');
const router = express.Router(); 

// 1. CORRECTLY DESTRUCTURE THE FUNCTIONS from the controller
const { 
    getProducts, 
    createProduct, 
    updateProduct,
    getRandomProduct,
    deleteProduct,
    getProductById 
} = require('../Controllers/productController'); // This path must be correct!

// 2. Import your middleware (assuming correct path)
const { protect, admin } = require('../Middleware/authMiddleware'); 

// 3. Define routes using the functions (getProducts, createProduct, etc.)
router.get("/random", getRandomProduct);
router.get("/public-list", getProducts); // Public endpoint for landing page
router.get("/:id", getProductById); // Public route for product details
router.route('/')
    .get(getProducts) // Public GET for products
    .post(protect, createProduct);

router.route('/:id')
    .put(protect, updateProduct) 
    .delete(protect, deleteProduct); 

module.exports = router;