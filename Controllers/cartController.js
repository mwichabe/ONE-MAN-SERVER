const asyncHandler = require('express-async-handler');
const Cart = require('../Models/cart');
const Product = require('../Models/product');
const mongoose = require('mongoose');


// Helper function to find the cart and populate user (including phone) and products
const getPopulatedCart = async (userId) => {
    return await Cart.findOne({ user: userId })
        .populate({
            path: 'user', // Populate the user field
            select: 'phone name email' // Include the phone field (and maybe name/email for context)
        })
        .populate('items.product'); // Populate the product details for cart items
};

// Function to structure the response
const formatCartResponse = (cart) => {
    if (!cart) {
        return { items: [], totalItems: 0, userPhone: null };
    }

    const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);

    return {
        items: cart.items,
        totalItems,
        // Access the phone from the populated user object
        userPhone: cart.user ? cart.user.phone : null, 
        // Note: You can also return other user details if needed, e.g., userName: cart.user.name
    };
};
/**
 * @desc    Add a product to the cart or update quantity
 * @route   POST /api/cart
 * @access  Private
 */
/**
 * @desc    Add a product to the cart or update quantity
 * @route   POST /api/cart
 * @access  Private
 */
const addToCart = asyncHandler(async (req, res) => {
    // 1. EXTRACT 'price' from the request body
    const { productId, size, quantity = 1, price } = req.body;
    const userId = req.user._id;
    
    // Declare finalPrice here so it's accessible in the entire function scope
    let finalPrice; 

    if (!productId || !size || price === undefined) {
        res.status(400);
        throw new Error('Please provide product ID, size, and price.');
    }

    const productToAdd = await Product.findById(productId);

    if (!productToAdd) {
        res.status(404);
        throw new Error('Product not found.');
    }
    
    // =========================================================================
    // ⚠️ SECURITY NOTE: Validate the price against the expected prices ⚠️
    // =========================================================================
    const FULL_PRICE = productToAdd.price;
    const DISCOUNT_RATE = 0.20; // 20%
    const EXPECTED_DISCOUNTED_PRICE = FULL_PRICE * (1 - DISCOUNT_RATE);
    
    // Define the two valid server-calculated prices
    const pricesToCheck = {
        full: parseFloat(FULL_PRICE.toFixed(2)),
        discounted: parseFloat(EXPECTED_DISCOUNTED_PRICE.toFixed(2))
    };

    // The price the client sent, rounded for comparison
    const clientPriceRounded = parseFloat(price.toFixed(2));
    
    // --- Determine if client price is valid ---
    const isFullPrice = clientPriceRounded === pricesToCheck.full;
    const isDiscountedPrice = clientPriceRounded === pricesToCheck.discounted;

    if (isFullPrice) {
        // Case 1: Client sent the full price (from ShopPage) - Use it.
        finalPrice = pricesToCheck.full;
    } else if (isDiscountedPrice) {
        // Case 2: Client sent the discounted price (from ProductDetails) - Use it.
        finalPrice = pricesToCheck.discounted;
    } else {
        // Case 3: Price Mismatch/Tampering Detected!
        // BEST PRACTICE: Default to the highest valid price (Full Price) for security
        // The client-sent price is NOT one of the two expected prices. 
        // We will default to the full price and log a strong warning.
        finalPrice = pricesToCheck.full;
        
        console.warn(
            `SECURITY WARNING: Price mismatch for product ${productId}. ` + 
            `Client sent ${clientPriceRounded}. Neither full (${pricesToCheck.full}) nor discounted ` +
            `(${pricesToCheck.discounted}) price matched. Using server-calculated FULL price: ${finalPrice}`
        );
    }
    // =========================================================================

    // Find the user's cart or create a new one
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
        cart = await Cart.create({ user: userId, items: [] });
    }

    // Check if the item (product + size variant) is already in the cart
    const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId && item.size === size
    );

    if (itemIndex > -1) {
        // Item exists: update quantity and price
        cart.items[itemIndex].quantity += quantity;
        cart.items[itemIndex].price = finalPrice; 
        
    } else {
        // Item does not exist: add new item
        cart.items.push({
            product: productId,
            name: productToAdd.name,
            size: size,
            quantity: quantity,
            price: finalPrice, 
        });
    }

    await cart.save();
    
    // Retrieve the newly updated cart with populated user and product info
    const updatedCart = await getPopulatedCart(userId);

    // Return the formatted response including the phone number
    res.status(201).json({ 
        message: `${productToAdd.name} (${size}) added to cart!`, 
        ...formatCartResponse(updatedCart) 
    });
});
/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const cart = await getPopulatedCart(userId);

    // if (!cart) {
    //     return res.status(200).json({ items: [], totalItems: 0 });
    // }

    // const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);

    // Return the formatted response including the phone number
    res.status(200).json(formatCartResponse(cart));
});
/**
 * @desc    Update quantity of an item in the cart
 * @route   PUT /api/cart/:itemId
 * @access  Private
 */
const updateCartItem = asyncHandler(async (req, res) => {
    const { quantity } = req.body;
    const { itemId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
        res.status(400);
        throw new Error('Invalid Cart Item ID format.');
    }

    if (quantity === undefined || quantity < 1) {
        res.status(400);
        throw new Error('Quantity must be a positive number.');
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
        res.status(404);
        throw new Error('Cart not found.');
    }

    // Find the item by its sub-document _id (this relies on the ID being valid)
    const item = cart.items.id(itemId);

    if (!item) {
        res.status(404);
        // This is the error message being returned when ID is correct but not found
        throw new Error('Cart item not found.'); 
    }

    item.quantity = quantity;
    await cart.save();

    // Re-fetch the updated cart with populated data (including phone)
    const updatedCart = await getPopulatedCart(userId);

    // Return the formatted response including the phone number
    res.status(200).json({
        message: 'Cart item removed.',
        ...formatCartResponse(updatedCart)
    });
});

/**
 * @desc    Remove an item from the cart
 * @route   DELETE /api/cart/:itemId
 * @access  Private
 */
const deleteCartItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const userId = req.user._id;

    // 🔑 FIX 5: Validate itemId as a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
        res.status(400);
        throw new Error('Invalid Cart Item ID format.');
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
        res.status(404);
        throw new Error('Cart not found.');
    }

    const originalLength = cart.items.length;
    // Use pull to remove the sub-document by its _id
    cart.items.pull({ _id: itemId }); 

    if (cart.items.length === originalLength) {
         res.status(404);
         throw new Error('Cart item not found.');
    }

    await cart.save();

    // Re-populate and return the updated cart items
    const updatedCart = await Cart.findOne({ user: userId }).populate('items.product');
    const totalItems = updatedCart.items.reduce((acc, currentItem) => acc + currentItem.quantity, 0);

    // 🔑 FIX 6: Ensure a JSON response is always sent on success
    res.status(200).json({
        message: 'Cart item removed.',
        items: updatedCart.items,
        totalItems: totalItems,
    });
});

module.exports = {
    addToCart,
    getCart,
    updateCartItem,
    deleteCartItem,
};
