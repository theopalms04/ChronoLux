const express = require("express");
const multer = require("multer");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const router = express.Router();

// Route to edit profile
router.put("/edit-profile/:userId", async (req, res) => {
  const { userId } = req.params;
  const { name, profilePicture, address, phoneNumber } = req.body;

  console.log("Received request to update profile for user:", userId);
  console.log("Request body:", { 
    name,
    profilePicture: profilePicture ? "Base64 string received" : "No image",
    address,
    phoneNumber
  });

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (address !== undefined) user.address = address;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

    // Upload profile picture if provided
    if (profilePicture) {
      console.log("Uploading image to Cloudinary...");
      const result = await cloudinary.uploader.upload(profilePicture, {
        folder: "profile-pictures",
      });
      user.profilePicture = result.secure_url;
      console.log("Image uploaded successfully:", result.secure_url);
    }

    await user.save();
    console.log("Profile updated successfully for user:", userId);

    res.status(200).json({ 
      message: "Profile updated successfully", 
      user: {
        _id: user._id,
        name: user.name,
        profilePicture: user.profilePicture,
        address: user.address,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

module.exports = router;