const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: "" },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
    validate: {
      validator: function (value) {
        return ["user", "admin"].includes(value);
      },
      message: (props) => `${props.value} is not a valid role!`,
    },
  },
  address: { type: String, default: "" }, // Simple string field
  phoneNumber: { type: String, default: "" } // Simple string field
});

module.exports = mongoose.model("User", UserSchema);