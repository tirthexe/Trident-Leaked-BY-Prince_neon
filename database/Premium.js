const mongoose = require("mongoose");

const PremiumSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // User ID
  duration: { type: String, required: true }, // Premium duration
  servers: { type: String, required: true }, // Server limit
  expiryDate: { type: Date, default: null }, // Expiry date (null for lifetime)
  activeServers: { type: [String], default: [] }, // List of active servers
});

module.exports = mongoose.model("Premium", PremiumSchema);