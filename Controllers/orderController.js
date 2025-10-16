const asyncHandler = require("express-async-handler");
const Order = require("../Models/Order");
const Cart = require("../Models/cart");
const mongoose = require("mongoose");
const User = require("../Models/userModel");
const {sendNewOrderNotification } = require("../Services/NotificationService");

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

module.exports = {
  addOrderItems,
  updateOrderPaymentContact,
  getOrderById,
};
