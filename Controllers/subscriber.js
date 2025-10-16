const Subscriber = require("../Models/subscriber");

const addSubscriber = async (req, res) => {
  const { email } = req.body;

  // Basic validation (Mongoose schema has more)
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Check if subscriber already exists
    const existingSubscriber = await Subscriber.findOne({ email });

    if (existingSubscriber) {
      return res.status(409).json({ message: "This email is already subscribed" });
    }

    // Create and save the new subscriber
    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    res.status(201).json({
      message: "Subscription successful! Welcome to the newsletter.",
      email: newSubscriber.email,
    });
  } catch (error) {
    // Handle Mongoose validation errors or general server errors
    console.error("Subscription error:", error);

    if (error.code === 11000) { 
        return res.status(409).json({ message: "This email is already subscribed" });
    }

    // Check for Mongoose validation error
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }

    res.status(500).json({ message: "Server error during subscription" });
  }
};

module.exports = { addSubscriber };