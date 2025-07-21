const mongoose = require("mongoose");

const bioSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  bio: { type: String, default: "No bio set" }, // Default bio
});

const Bio = mongoose.model("Bio", bioSchema);

module.exports = Bio;