const User = require("../Models/userModel");
const { generateToken, JWT_SECRET } = require("../Utils/authUtils");
const jwt = require("jsonwebtoken");

/**
 * Handles user registration.
 * @route POST /api/users/register
 */
const registerUser = async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password || !phone)
    return res.status(400).json({ message: "Please enter all fields." });

  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists." });

    // Creates a new user (isAdmin will default to false, or whatever your model sets)
    const user = await User.create({ name, email, password, phone });

    const token = generateToken(user._id);
    // Set the JWT as an HTTP-only cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "Lax",
    });

    // FIX 1: Include isAdmin in the registration response
    res.status(201).json({ 
        _id: user._id, 
        name: user.name, 
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
};

/**
 * Handles user login.
 * @route POST /api/users/login
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Please enter all fields." });

  try {
    // FIX 2: Ensure we get the latest user data including isAdmin from the DB
    const user = await User.findOne({ email });

    // Check if user exists and the password matches (using Mongoose instance method)
    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "Lax",
      });

      // FIX 3: Include isAdmin in the login response
      res
        .status(200)
        .json({ 
            _id: user._id, 
            name: user.name, 
            email: user.email,
            phone: user.phone,
            isAdmin: user.isAdmin,
            token,
        });
    } else {
      res.status(401).json({ message: "Invalid email or password." });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};

/**
 * Handles user logout by clearing the cookie.
 * @route POST /api/users/logout
 */
const logoutUser = (req, res) => {
  // Clear the JWT cookie by setting its expiration to the past
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
    sameSite: "Lax",
  });
  res.status(200).json({ message: "User logged out successfully" });
};

/**
 * Checks the current authentication status based on the JWT cookie.
 * @route GET /api/users/me
 */
const getMe = async (req, res) => {
  try {
    // 🔹 Extract token from either cookie or Authorization header
    const token =
      req.cookies?.jwt ||
      (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(200).json({ isLoggedIn: false, user: null });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (user) {
      return res.status(200).json({
        isLoggedIn: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone, // ✅ phone will now appear
          isAdmin: user.isAdmin,
        },
      });
    } else {
      return res.status(200).json({ isLoggedIn: false, user: null });
    }
  } catch (error) {
    console.error("Error in getMe:", error);
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0),
      sameSite: "Lax",
    });
    res.status(200).json({ isLoggedIn: false, user: null });
  }
};

// const getMe = async (req, res) => {
//   // Check if req.cookies.jwt exists but not yet verified by middleware
//   const token = req.cookies.jwt;
//   if (!token) {
//     return res.status(200).json({ isLoggedIn: false, user: null });
//   }

//   try {
//     // Decode the token to get the user ID
//     const decoded = jwt.verify(token, JWT_SECRET);
//     // Find the user by ID, excluding the password field
//     // This is a FRESH database read, so 'user' has the correct isAdmin value
//     const user = await User.findById(decoded.id).select("-password");

//     if (user) {
//       // FIX 4: Include isAdmin in the /me status check response
//       res
//         .status(200)
//         .json({
//           isLoggedIn: true,
//           user: { 
//               _id: user._id, 
//               name: user.name, 
//               email: user.email,
//               phone: user.phone,
//               isAdmin: user.isAdmin,
//           },
//         });
//     } else {
//       // Token was valid but user not found (e.g., deleted account)
//       res.status(200).json({ isLoggedIn: false, user: null });
//     }
//   } catch (error) {
//     // Token is present but invalid/expired, clear the bad cookie
//     res.cookie("jwt", "", {
//       httpOnly: true,
//       expires: new Date(0),
//       sameSite: "Lax",
//     });
//     res.status(200).json({ isLoggedIn: false, user: null });
//   }
// };
//
/**
 * Updates user profile data (name, email, password).
 * @route PUT /api/users/profile
 * @access Private (requires authentication)
 */
const updateUserProfile = async (req, res) => {
  // The 'protect' middleware should attach the user ID to req.user
  const user = await User.findById(req.user._id);

  if (user) {
    // Update fields only if they are provided in the request body
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone =req.body.phone || user.phone;

    // Only update password if a new one is provided
    if (req.body.password) {
      user.password = req.body.password;
    }

    try {
      const updatedUser = await user.save();

      // Return the updated user data (excluding password)
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        isAdmin: updatedUser.isAdmin,
        message: "Profile updated successfully!",
      });
    } catch (error) {
      // Handle potential validation errors (like duplicate email)
      console.error("Profile update error:", error);
      res.status(400).json({ message: "Error updating profile. Check email format or if email is already in use." });
    }
  } else {
    res.status(404).json({ message: "User not found." });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateUserProfile
};