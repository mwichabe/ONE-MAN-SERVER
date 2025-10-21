const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/authMiddleware'); 
const { addOrderItems,getOrderById,updateOrderPaymentContact, 
    handlePaystackWebhook,
    initializePaystackPayment,
  } = require('../Controllers/orderController');

router.route('/')
    .post(protect, addOrderItems); 

router.route('/:id')
    .get(protect, getOrderById);

router.route('/:id/payment-contact')
    .put(protect, updateOrderPaymentContact); 

// Route to INITIATE a Paystack payment for a specific order (Protected)
router.route('/:id/paystack-init')
    .post(protect, initializePaystackPayment); 

// Route to receive WEBHOOKS from Paystack (Public - MUST NOT use 'protect')
router.route('/paystack-webhook')
    .post(handlePaystackWebhook);

// You will add more routes here later (e.g., router.route('/:id').get(protect, getOrderById))

module.exports = router;