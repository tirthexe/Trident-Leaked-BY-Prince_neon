const mongoose = require('mongoose');

const pingCountSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  channelId: String,
  usedPings: { type: Number, default: 0 },
});

module.exports = mongoose.model('PingCount', pingCountSchema);