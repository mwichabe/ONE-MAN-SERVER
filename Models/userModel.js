const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        minlength: 3, 
        maxlength: 50 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        match: [/.+@.+\..+/, "Invalid email"] 
    },
    phone: { 
        type: String, 
        required: true, 
        minlength: 3, 
        maxlength: 50 
    },
    password: { 
        type: String, 
        required: true, 
        minlength: 6 
    },
    // --- ADMIN ROLE ADDITION ---
    isAdmin: {
        type: Boolean,
        required: true,
        default: false
    },
    // ---------------------------
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
});

// Pre-save hook to hash password before saving to the database
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare the user's entered password with the hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// If model already exists (cached), delete it to force reload
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User = mongoose.model("User", userSchema);
module.exports = User;