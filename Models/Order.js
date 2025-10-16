const mongoose = require('mongoose');

// Define the schema for items within the order
const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to your Product model
        required: true,
    },
    name: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }, // Price at the time of order
});

// Define the full Order schema
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [orderItemSchema],
    
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true, default: 'Kenya' },
    },
    
    shippingMethod: { type: String, required: true },
    
    paymentMethod: { type: String, required: true },
    paymentResult: { 
        id: { type: String },
        status: { type: String },
        update_time: { type: String },
    },
    paymentContact: { 
        type: String, 
        required: false,
    },
    
    itemsPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },

}, {
    timestamps: true,
});

// If model already exists (cached), delete it to force reload
if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
