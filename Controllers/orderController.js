const asyncHandler = require("express-async-handler");
const Order = require("../Models/Order");
const Cart = require("../Models/cart");
const mongoose = require("mongoose");
const User = require("../Models/userModel");
const {sendNewOrderNotification } = require("../Services/NotificationService");
const axios = require("axios");
const crypto = require("crypto");

// Paystack API Base URL
const PAYSTACK_API_URL = "https://api.paystack.co";
const PAYSTACK_SECRET_KEY = "sk_test_d39493d97a18fc82ca452127ef8a5bb73c856808";
/**
 * @desc    Verify transaction status with Paystack
 * @param   {string} reference - The transaction reference from Paystack
 * @returns {Promise<object>} Paystack verification data
 */
const verifyPaystackTransaction = async (reference) => {
  try {
    const response = await axios.get(
      `${PAYSTACK_API_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Paystack Verification Error:", error.response ? error.response.data : error.message);
    throw new Error("Paystack transaction verification failed.");
  }
};
/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
const addOrderItems = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Destructure required fields from the frontend payload
  const {
    shippingAddress,
    shippingMethod,
    paymentMethod,
    items,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    phone,
  } = req.body;

  // 1. Basic Validation
  if (items && items.length === 0) {
    res.status(400);
    throw new Error("No order items found.");
  }

  // 2. Fetch User Data to get the Phone Number
  // We need the phone number to be saved as the paymentContact.
  const user = await User.findById(userId).select("phone"); // Select only the phone field

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  // 3. Create the Order
  const order = new Order({
    user: userId,
    items: items.map((item) => ({
      product: item.product,
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
    })),
    shippingAddress,
    shippingMethod,
    paymentMethod,
    paymentContact: phone,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  });

  const createdOrder = await order.save();
  //console.log(`Saved Order:`,order)

  // 4. Clear the User's Cart
  // Since the order is successfully placed, remove the user's cart document.
  await Cart.deleteOne({ user: userId });
  sendNewOrderNotification(createdOrder);
  //5. Respond to the Frontend
  res.status(201).json({
    message: "Order successfully placed.",
    order: createdOrder,
  });
});

/**
 * @desc    Update order with user's phone number for payment tracking
 * @route   PUT /api/orders/:id/payment-contact
 * @access  Private
 */
const updateOrderPaymentContact = asyncHandler(async (req, res) => {
  const { id } = req.params; // Order ID
  const { phoneNumber } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Order ID format.");
  }

  if (!phoneNumber || phoneNumber.length < 9) {
    // Basic length check for Kenyan numbers
    res.status(400);
    throw new Error("Valid phone number is required.");
  }

  const order = await Order.findById(id);

  if (order) {
    // Ensure the order belongs to the logged-in user
    if (order.user.toString() !== userId.toString()) {
      res.status(403);
      throw new Error("Not authorized to update this order.");
    }

    // Prevent updating if the order is already paid
    if (order.isPaid) {
      res.status(400);
      throw new Error("Order is already paid.");
    }

    // 🔑 Update the payment contact field
    order.paymentContact = phoneNumber;

    const updatedOrder = await order.save();

    res.status(200).json({
      message: "Payment contact information saved successfully.",
      paymentContact: updatedOrder.paymentContact,
    });
  } else {
    res.status(404);
    throw new Error("Order not found.");
  }
});

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Order ID format.");
  }

  // Find the order and populate the user and product details for review
  const order = await Order.findById(id)
    .populate("user", "name email") // Get user name and email
    .populate("items.product", "name price imageUrls"); // Get product details (optional, but good for robust review)

  if (order) {
    // Security check: Only allow the owner of the order or an admin to view it
    if (order.user._id.toString() !== userId.toString()) {
      res.status(403);
      throw new Error("Not authorized to view this order.");
    }

    res.status(200).json(order);
  } else {
    res.status(404);
    throw new Error("Order not found.");
  }
});
/*
 * @desc    Initialize Paystack transaction for an existing order
 * @route   POST /api/orders/:id/paystack-init
 * @access  Private
 */
const initializePaystackPayment = asyncHandler(async (req, res) => {
  const { id } = req.params; // Order ID
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Order ID format.");
  }

  const order = await Order.findById(id).populate("user", "email");

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  // Security checks
  if (order.user._id.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("Not authorized to pay for this order.");
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error("Order is already paid.");
  }

  // Paystack requires amount in **subunits** (e.g., Kobo for NGN, Cent for USD).
  // Assuming totalPrice is in the major unit (e.g., KES, NGN, USD).
  const amountInSubunits = Math.round(order.totalPrice * 100);

  // Payload for Paystack's Initialize Transaction API
  const paystackPayload = {
    email: order.user.email,
    amount: amountInSubunits,
    reference: order._id.toString(), // Use the MongoDB Order ID as the unique reference
    // Optional: Add metadata to track the Order ID directly in Paystack
    metadata: {
      custom_fields: [{
        display_name: "Order ID",
        variable_name: "order_id",
        value: order._id.toString(),
      }],
    },
    // Specify bank transfer/mobile money as a channel if needed, or leave blank to show all
    channels: ["card", "bank_transfer", "mobile_money"], 
    // You must set a callback URL for the redirect flow after payment (optional for webhooks)
    // callback_url: process.env.FRONTEND_PAYMENT_SUCCESS_URL, 
  };

  try {
    const { data: paystackResponse } = await axios.post(
      `${PAYSTACK_API_URL}/transaction/initialize`,
      paystackPayload,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (paystackResponse.status) {
      // 🔑 Important: Save the Paystack transaction reference to the order
      order.paystackReference = paystackResponse.data.reference;
      await order.save();

      // Return the authorization URL and reference to the frontend
      res.status(200).json({
        authorization_url: paystackResponse.data.authorization_url,
        reference: paystackResponse.data.reference,
      });
    } else {
      res.status(400);
      throw new Error(`Paystack Initialization Failed: ${paystackResponse.message}`);
    }
  } catch (error) {
    console.error("Initialization Error:", error.response ? error.response.data : error.message);
    res.status(500);
    throw new Error("Failed to initialize payment with Paystack.");
  }
});

/**
 * @desc    Handle Paystack Webhook events (Payment Success)
 * @route   POST /api/orders/paystack-webhook
 * @access  Public (Called by Paystack, not the user)
 */
const handlePaystackWebhook = asyncHandler(async (req, res) => {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body)) // Use the raw body string here!
    .digest("hex");

  // 1. **Verify Webhook Signature**
  if (hash !== req.headers["x-paystack-signature"]) {
    // Return 200 to prevent Paystack from retrying, but log error
    console.error("Paystack Webhook Signature Mismatch: Suspected unauthorized call.");
    return res.sendStatus(200); 
  }

  // 2. **Process Event**
  const event = req.body;
  const { data, event: eventType } = event;

  // We are interested in the 'charge.success' event for transaction status
  if (eventType === "charge.success" && data.status === "success") {
    const paystackReference = data.reference;
    const orderId = data.metadata.custom_fields.find(
      (f) => f.variable_name === "order_id"
    )?.value;

    if (!orderId) {
      console.error(`Webhook Error: Order ID not found in metadata for ref ${paystackReference}`);
      return res.sendStatus(200);
    }
    
    // 3. **Verify Transaction and Update Order**
    const order = await Order.findById(orderId);

    if (order && !order.isPaid) {
        // Optional: Perform a secondary verification to be extra safe
        const verification = await verifyPaystackTransaction(paystackReference);
        
        if (verification.status && verification.data.status === 'success') {
             // 🔑 The key update logic!
            order.isPaid = true;
            order.paidAt = Date.now();
            order.paymentResult = {
                id: data.id,
                status: data.status,
                update_time: data.paid_at,
                email_address: data.customer.email,
            };
            await order.save();

            console.log(`Order ${orderId} successfully paid via Paystack.`);
        } else {
             console.error(`Webhook Error: Verification failed for Paystack ref ${paystackReference}`);
        }
    } else if (order && order.isPaid) {
      console.log(`Order ${orderId} already marked as paid. Skipping update.`);
    } else {
      console.error(`Order ${orderId} not found in database.`);
    }
  }

  // 4. **Acknowledge Webhook**
  // MUST return a 200 OK response immediately to stop Paystack from retrying.
  res.sendStatus(200);
});

module.exports = {
  addOrderItems,
  updateOrderPaymentContact,
  getOrderById,
  handlePaystackWebhook,
  initializePaystackPayment
};
