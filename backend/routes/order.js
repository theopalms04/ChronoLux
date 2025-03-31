const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
router.post("/", async (req, res) => {
  try {
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const { userId, items, shippingAddress, paymentMethod } = req.body;

    // Check required fields
    const missingFields = [];
    if (!userId) missingFields.push("userId");
    if (!items || !Array.isArray(items) || items.length === 0) missingFields.push("items");
    if (!shippingAddress) missingFields.push("shippingAddress");
    if (!paymentMethod) missingFields.push("paymentMethod");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        missingFields,
        receivedBody: req.body
      });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Process order items
    let totalAmount = 0;
    const processedItems = [];
    const productUpdates = [];

    for (const [index, item] of items.entries()) {
      // Validate item structure
      if (!item.productId || !item.quantity) {
        return res.status(400).json({
          message: `Item ${index} is missing productId or quantity`,
          item
        });
      }

      // Validate product exists
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          message: `Product not found: ${item.productId}`,
          itemIndex: index
        });
      }

      // Validate quantity
      if (item.quantity <= 0) {
        return res.status(400).json({
          message: `Invalid quantity for product ${product.name}`,
          itemIndex: index,
          minQuantity: 1
        });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
          itemIndex: index,
          available: product.quantity,
          requested: item.quantity
        });
      }

      // Calculate item total
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      // Prepare order item
      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        priceAtOrder: product.price
      });

      // Prepare product update
      productUpdates.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $inc: { quantity: -item.quantity } }
        }
      });
    }

    // Update product quantities in bulk
    if (productUpdates.length > 0) {
      await Product.bulkWrite(productUpdates);
    }

    // Create the order
    const order = new Order({
      user: userId,
      items: processedItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: "pending",
      status: "pending"
    });

    const savedOrder = await order.save();
    
    // Populate product details in response
    const populatedOrder = await Order.populate(savedOrder, [
      { path: "user", select: "name email" },
      { path: "items.product", select: "name price photo" }
    ]);

    res.status(201).json({
      message: "Order created successfully",
      order: populatedOrder
    });

  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      message: "Error creating order",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
});

// @desc    Get all orders for a user
// @route   GET /api/orders/user/:userId
// @access  Private
router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .populate("user", "name email")
      .populate("items.product", "name price photo category")
      .sort({ createdAt: -1 });

    res.json({
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching orders",
      error: error.message
    });
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:orderId
// @access  Private
router.get("/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("user", "name email phoneNumber address")
      .populate("items.product", "name price photo description");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching order",
      error: error.message
    });
  }
});

// @desc    Update order status
// @route   PATCH /api/orders/:orderId/status
// @access  Private (Admin)
router.patch("/:orderId/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
        validStatuses
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true, runValidators: true }
    ).populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order status updated",
      order
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating order status",
      error: error.message
    });
  }
});

// @desc    Delete an order
// @route   DELETE /api/orders/:orderId
// @access  Private (Admin)
router.delete("/:orderId", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order removed" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting order",
      error: error.message
    });
  }
});











// In your backend routes (orders.js)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email")
      .populate("items.product", "name price photo")
      .sort({ createdAt: -1 });

    res.json(orders); // Or res.json({ orders }) if you prefer object format
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      message: "Error fetching orders",
      error: error.message
    });
  }
});



module.exports = router;