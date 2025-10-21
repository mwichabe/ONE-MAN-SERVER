const express = require('express');
const router = express.Router(); 

// 1. CORRECTLY DESTRUCTURE THE FUNCTIONS from the controller
const { 
    getProducts, 
    createProduct, 
    updateProduct, 
    getRandomProduct,
    deleteProduct 
} = require('../Controllers/productController'); // This path must be correct!

// 2. Import your middleware (assuming correct path)
const { protect, admin } = require('../Middleware/authMiddleware'); 

// 3. Define routes using the functions (getProducts, createProduct, etc.)
router.get("/random", getRandomProduct);
router.get("/public-list", protect, getProducts);
router.route('/')
    .get(protect, getProducts) // ✅ getProducts is a function
    .post(protect, createProduct);

router.route('/:id')
    .put(protect, updateProduct) 
    .delete(protect, deleteProduct); 

module.exports = router;