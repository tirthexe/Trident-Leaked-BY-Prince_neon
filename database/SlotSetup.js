const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  guildId: String,
  categories: { type: [String], default: [] },
  slotRole: { type: String, default: null },
  slots: [
    {
      userId: String,
      channelId: String,
      pingCount: String,
      activatedAt: Number,
      expiration: Number,
    },
  ],
});

module.exports = mongoose.model('SlotSetup', slotSchema);