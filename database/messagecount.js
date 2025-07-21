const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  allTime: { type: Number, default: 0 },
  month: { type: Number, default: 0 },
  week: { type: Number, default: 0 },
  today: { type: Number, default: 0 },
  yesterday: { type: Number, default: 0 }
}, { _id: false });

const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enable: { type: Boolean, default: false },

  blacklist: {
    channels: [{ type: String }],
    categories: [{ type: String }],
    users: [{ type: String }]
  },

  users: [userStatsSchema]
});

module.exports = mongoose.model('messagecount', guildSchema);