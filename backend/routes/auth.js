const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Register User
router.post("/register", async (req, res) => {
  const { name, email, password, address, phoneNumber } = req.body;

  try {
    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with the default role "user"
    user = new User({
      name,
      email,
      password: hashedPassword,
      address: address || "", // Set to empty string if not provided
      phoneNumber: phoneNumber || "", // Set to empty string if not provided
      role: "user", // Default role
    });

    // Save the user to the database
    await user.save();

    // Respond with success message and user data (excluding password)
    res.status(201).json({ 
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login User
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role // Include role in the token payload
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1h" }
    );

    // Return the token and user details (excluding sensitive data)
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture || "",
        role: user.role
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;