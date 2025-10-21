const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const userRoutes = require("./Routes/userRoutes");
const adminRoutes = require("./Routes/adminProductRoutes"); 
const cartRoutes = require("./Routes/cart");
const orderRoute = require("./Routes/orderRoutes");
const contactRoute = require("./Routes/contactRoutes");
const subscribeRoute = require("./Routes/subscriberRoute");
const { errorHandler } = require("./Middleware/errorHandler");

// --- DATABASE CONNECTION ---
mongoose
  .connect(
    "mongodb+srv://mwichabecollins:9dV1iOI0aqXWDFH8@cluster0.pfbrzgm.mongodb.net/"
  )
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.log("MongoDB Connection Error:", error));

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE CONFIGURATION ---

const allowedOrigins = [
    "https://one-man-botique.pages.dev",
    "http://localhost:5173" 
];
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use('/api/orders/paystack-webhook', express.raw({ type: 'application/json' }));
// We use a middleware to re-add JSON parsing for routes that are NOT the webhook
app.use((req, res, next) => {
    // Only parse the body as JSON if the route is NOT the webhook route
    if (req.originalUrl.startsWith('/api/orders/paystack-webhook')) {
        // For the webhook, we must parse the raw body into JSON 
        // and attach the original buffer for the hash calculation in the controller.
        try {
            req.paystackRawBody = req.body.toString('utf8');
            req.body = JSON.parse(req.paystackRawBody);
        } catch (e) {
            console.error('Error parsing raw webhook body:', e);
            return res.sendStatus(400); // Bad Request if body isn't JSON
        }
    } else {
        // For all other routes, use standard JSON parsing
        express.json()(req, res, next);
        return;
    }
    next();
});

// Ensures URL-encoded data works for non-webhook forms
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("API is running...");
});

// --- ROUTES ---
app.use("/api/users", userRoutes); 
// 3. Link Admin Routes to the /api/admin/products endpoint
app.use("/api/admin/products", adminRoutes);
app.use("/api/cart",cartRoutes);
app.use('/api/orders', orderRoute);
app.use('/api/contact',contactRoute);
app.use('/api/subscribe',subscribeRoute);

app.use(errorHandler);

// --- SERVER START ---
app.listen(PORT, () => console.log(`Server is now running on PORT ${PORT}`));