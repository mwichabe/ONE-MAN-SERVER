// controllers/contactController.js

const asyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');

// --- Nodemailer Transporter Setup ---
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email provider here (e.g., 'gmail', 'SendGrid', etc.)
    auth: {
        // It's generally safer to rely on environment variables (process.env)
        user: process.env.STORE_EMAIL || "mwichabecollins@gmail.com",
        pass: process.env.STORE_EMAIL_PASSWORD || "vywkybtedndjpajr"
    }
});

/**
 * @desc    Handle incoming contact form submission and send an email
 * @route   POST /api/contact
 * @access  Public
 */
const sendContactEmail = asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        res.status(400);
        throw new Error('Please fill out all fields.');
    }

    // --- Email Content ---
    const mailOptions = {
        // The email address that will receive the message
        to: process.env.STORE_EMAIL || "mwichabecollins@gmail.com", 
        // The sender visible to the store email (important for tracking)
        from: `"${name}" <${email}>`, 
        // Subject line for the store
        subject: `New Contact Form: ${subject}`, 
        // The message body
        text: `You have received a new contact message.\n\n`
            + `Name: ${name}\n`
            + `Email: ${email}\n`
            + `Subject: ${subject}\n\n`
            + `Message:\n${message}`,
        // Optional HTML body for better formatting
        html: `
            <h3>New Contact Form Submission</h3>
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
        `,
    };

    // --- Send Email ---
    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error sending contact email:', error);
        res.status(500);
        throw new Error('Email delivery failed. Please check server logs.');
    }
});


module.exports = { sendContactEmail };