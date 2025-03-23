require("dotenv").config(); // Ensure .env is loaded at the top
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("MONGO_URI:", process.env.MONGO_URI); // Debugging Line

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
