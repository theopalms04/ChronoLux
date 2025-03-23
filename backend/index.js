require("dotenv").config(); // Ensure .env is loaded before anything else
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const authRoutes = require("./routes/auth");

// Connect to DB
connectDB();
const userRoutes = require("./routes/user");

const app = express();

// Configure CORS to allow React Native frontend
app.use(
  cors({
    // origin: "exp://192.168.0.130:8081", // Allow all origins (change to specific URL in production)
    // methods: ["GET", "POST", "PUT", "DELETE"],
    // allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Routes
app.use("/api/", authRoutes);
app.use("/api/user", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

