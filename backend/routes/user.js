const express = require("express");
const multer = require("multer");
const User = require("../models/User"); // Adjust the path to your User model
const cloudinary = require("../config/cloudinary"); // Adjust the path to your Cloudinary config
const router = express.Router();

// Route to edit profile
router.put("/edit-profile/:userId", async (req, res) => {
  const { userId } = req.params;
  const { name, email, profilePicture } = req.body; // profilePicture is a Base64 string

  console.log("Received request to update profile for user:", userId); // Debugging log
  console.log("Request body:", { name, email, profilePicture: profilePicture ? "Base64 string received" : "No image" }); // Debugging log

  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found:", userId); // Debugging log
      return res.status(404).json({ message: "User not found" });
    }

    // Update name and email if provided
    if (name) user.name = name;
    if (email) user.email = email;

    // Upload profile picture to Cloudinary if provided
    if (profilePicture) {
      console.log("Uploading image to Cloudinary..."); // Debugging log
      const result = await cloudinary.uploader.upload(profilePicture, {
        folder: "profile-pictures", // Optional: Organize images in a folder
      });
      user.profilePicture = result.secure_url; // Save the Cloudinary URL
      console.log("Image uploaded successfully:", result.secure_url); // Debugging log
    }

    // Save the updated user
    await user.save();
    console.log("Profile updated successfully for user:", userId); // Debugging log

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating profile:", error); // Debugging log
    res.status(500).json({ message: "Failed to update profile" });
  }
});

module.exports = router;