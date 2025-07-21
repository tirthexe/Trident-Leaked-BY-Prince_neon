const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  channelId: {
    type: String,
    default: null,
  },
  bypassRoles: {
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model("Media", mediaSchema);