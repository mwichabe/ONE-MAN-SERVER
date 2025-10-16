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
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json()); // Allows parsing of JSON request bodies
app.use(express.urlencoded({ extended: false })); // Allows parsing of URL-encoded data

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

// --- SERVER START ---
app.listen(PORT, () => console.log(`Server is now running on PORT ${PORT}`));