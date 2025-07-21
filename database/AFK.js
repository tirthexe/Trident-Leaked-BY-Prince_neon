const mongoose = require('mongoose');

const AFKSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  reason: { type: String, default: 'No reason provided.' },
  timestamp: { type: Number, required: true },
});

module.exports = mongoose.model('AFK', AFKSchema);