const mongoose = require('mongoose');

const voiceStatsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  allTime: { type: Number, default: 0 },     // stored in seconds
  month: { type: Number, default: 0 },
  week: { type: Number, default: 0 },
  today: { type: Number, default: 0 },
  yesterday: { type: Number, default: 0 }
}, { _id: false });

const voiceGuildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enable: { type: Boolean, default: false },

  blacklist: {
    channels: [{ type: String }],
    categories: [{ type: String }],
    users: [{ type: String }]
  },

  users: [voiceStatsSchema]
});

module.exports = mongoose.model('voicecount', voiceGuildSchema);