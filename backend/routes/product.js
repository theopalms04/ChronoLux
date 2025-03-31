        const express = require("express");
        const Product = require("../models/Product"); // Import the Product model
        const cloudinary = require("../config/cloudinary"); // Adjust the path to your Cloudinary config
        const router = express.Router();

        // Configure Cloudinary
        cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your Cloudinary cloud name
        api_key: process.env.CLOUDINARY_API_KEY, // Your Cloudinary API key
        api_secret: process.env.CLOUDINARY_API_SECRET, // Your Cloudinary API secret
        });

        // Utility function to upload image to Cloudinary
        const uploadImageToCloudinary = async (base64Image) => {
        try {
            const result = await cloudinary.uploader.upload(base64Image, {
            folder: "products", // Optional: Organize images in a folder
            });
            return result.secure_url; // Return the secure URL of the uploaded image
        } catch (error) {
            console.error("Error uploading image to Cloudinary:", error);
            throw new Error("Failed to upload image");
        }
        };

        // Create a new product (POST /products)
        router.post("/create", async (req, res) => {
        try {
            const { name, description, price, quantity, category, photo } = req.body;

            // Validate required fields
            if (!name || !price || !quantity || !category) {
            return res.status(400).json({ message: "Missing required fields" });
            }

            let photoUrl = "";
            if (photo) {
            // Upload the base64 image to Cloudinary
            photoUrl = await uploadImageToCloudinary(photo);
            }

            // Create a new product
            const newProduct = new Product({
            name,
            description,
            price,
            quantity,
            category,
            photo: photoUrl, // Save the Cloudinary URL
            });

            // Save the product to the database
            await newProduct.save();

            // Return the created product
            res.status(201).json(newProduct);
        } catch (error) {
            console.error("Error creating product:", error);
            res.status(500).json({ message: "Server error" });
        }
        });

        // Get all products (GET /products)
        router.get("/", async (req, res) => {
        try {
            const products = await Product.find(); // Fetch all products
            res.status(200).json(products);
        } catch (error) {
            console.error("Error fetching products:", error);
            res.status(500).json({ message: "Server error" });
        }
        });

        // Get a single product by ID (GET /products/:id)
        router.get("/:id", async (req, res) => {
        try {
            const product = await Product.findById(req.params.id); // Find product by ID
            if (!product) {
            return res.status(404).json({ message: "Product not found" });
            }
            res.status(200).json(product);
        } catch (error) {
            console.error("Error fetching product:", error);
            res.status(500).json({ message: "Server error" });
        }
        });

        // Update a product by ID (PUT /products/:id)
        router.put("/:id", async (req, res) => {
        try {
            const { name, description, price, quantity, category, photo } = req.body;

            let photoUrl = "";
            if (photo) {
            // Upload the base64 image to Cloudinary
            photoUrl = await uploadImageToCloudinary(photo);
            }

            // Find the product by ID and update it
            const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                price,
                quantity,
                category,
                photo: photoUrl || undefined, // Update photo only if a new one is provided
            },
            { new: true } // Return the updated product
            );

            if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
            }

            res.status(200).json(updatedProduct);
        } catch (error) {
            console.error("Error updating product:", error);
            res.status(500).json({ message: "Server error" });
        }
        });

        // Delete a product by ID (DELETE /products/:id)
        router.delete("/:id", async (req, res) => {
        try {
            const deletedProduct = await Product.findByIdAndDelete(req.params.id); // Find and delete product by ID
            if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
            }
            res.status(200).json({ message: "Product deleted successfully" });
        } catch (error) {
            console.error("Error deleting product:", error);
            res.status(500).json({ message: "Server error" });
        }
        });

        module.exports = router;