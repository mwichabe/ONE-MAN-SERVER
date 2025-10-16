const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/authMiddleware'); 
const { addOrderItems,getOrderById,updateOrderPaymentContact  } = require('../Controllers/orderController');

router.route('/')
    .post(protect, addOrderItems); 

router.route('/:id')
    .get(protect, getOrderById);

router.route('/:id/payment-contact')
    .put(protect, updateOrderPaymentContact); 

// You will add more routes here later (e.g., router.route('/:id').get(protect, getOrderById))

module.exports = router;