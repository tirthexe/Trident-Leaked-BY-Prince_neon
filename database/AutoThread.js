const mongoose = require("mongoose");

const AutoThreadSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  channelId: { type: String, default: null },
  roleId: { type: String, default: null },
});

module.exports = mongoose.model("AutoThread", AutoThreadSchema);