const nodemailer = require('nodemailer');

// 1. Configure the Transporter using the environment variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.STORE_EMAIL || "mwichabecollins@gmail.com",
        pass: process.env.STORE_EMAIL_PASSWORD || "vywkybtedndjpajr", 
    },
});

/**
 * Sends an email notification to the admin when a new order is placed.
 * * @param {object} orderDetails - The newly created order object.
 */
const sendNewOrderNotification = async (orderDetails) => {
    
    // Format the items list for the email body
    const itemsListHtml = orderDetails.items.map(item => `
        <li>
            ${item.quantity} x ${item.name} (${item.size}) - ${item.price} KES
        </li>
    `).join('');

    const mailOptions = {
        // Recipient is the Admin/Store owner
        to: 'collinsdveloper0@gmail.com', 
        
        // Sender uses the store's email
        from: `ONE MAN BOTIQUE New Order <${process.env.STORE_EMAIL || "mwichabecollins@gmail.com"}>`,
        
        subject: `🚨 NEW ORDER RECEIVED: #${orderDetails._id.toString().slice(-6)} | Total: KES ${orderDetails.totalPrice.toFixed(2)}`,
        
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd;">
                <h2 style="color: #333;">New Order Notification</h2>
                <p>A new order has been placed on ONE MAN BOTIQUE!</p>
                
                <h3 style="color: #5cb85c;">Order Details (ID: ${orderDetails._id.toString()})</h3>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr><td style="padding: 5px; border-bottom: 1px solid #eee; font-weight: bold;">Order Total:</td><td style="padding: 5px; border-bottom: 1px solid #eee; color: #d9534f; font-weight: bold;">KES ${orderDetails.totalPrice.toFixed(2)}</td></tr>
                    <tr><td style="padding: 5px; border-bottom: 1px solid #eee;">Payment Method:</td><td style="padding: 5px; border-bottom: 1px solid #eee;">${orderDetails.paymentMethod}</td></tr>
                    <tr><td style="padding: 5px; border-bottom: 1px solid #eee;">Payment Contact:</td><td style="padding: 5px; border-bottom: 1px solid #eee;">${orderDetails.paymentContact}</td></tr>
                    <tr><td style="padding: 5px;">Shipping Method:</td><td style="padding: 5px;">${orderDetails.shippingMethod}</td></tr>
                </table>

                <h4 style="color: #333;">Items Ordered:</h4>
                <ul style="list-style-type: none; padding-left: 0;">
                    ${itemsListHtml}
                </ul>

                <h4 style="color: #333;">Shipping To:</h4>
                <p>
                    ${orderDetails.shippingAddress.address}, ${orderDetails.shippingAddress.city} - ${orderDetails.shippingAddress.postalCode}, ${orderDetails.shippingAddress.country}
                </p>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;"/>
                <p style="text-align: center; color: #777; font-size: 12px;">Please process this order promptly.</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Admin New Order Notification sent: %s", info.messageId);
    } catch (error) {
        // IMPORTANT: Log the error but DO NOT block the order placement process.
        console.error("ERROR: Failed to send new order notification email:", error.message);
    }
};

module.exports = { sendNewOrderNotification };