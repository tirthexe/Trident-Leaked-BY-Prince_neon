const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  badges: { type: [String], default: [] },
});

module.exports = mongoose.model('Badge', badgeSchema);