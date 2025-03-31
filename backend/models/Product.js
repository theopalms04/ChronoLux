const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true, // Removes extra spaces
    },
    description: {
      type: String,
      trim: true,
      default: "", // Optional field
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"], // Ensure price is non-negative
    },
    quantity: {
      type: Number,
      required: [true, "Product quantity is required"],
      min: [0, "Quantity cannot be negative"], // Ensure quantity is non-negative
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
    },
    photo: {
      type: String,
      default: "", // Optional field
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  }
);

// Create and export the Product model
module.exports = mongoose.model("Product", ProductSchema);