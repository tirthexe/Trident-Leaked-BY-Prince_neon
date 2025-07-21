const mongoose = require("mongoose");

const globalBlacklistSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  reason: { type: String, default: "Auto blacklisted" },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SpammGlobalBlacklist", globalBlacklistSchema);