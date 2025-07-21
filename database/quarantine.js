const mongoose = require("mongoose");

const QuarantineSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  roleId: { type: String, default: null },
  logChannelId: { type: String, default: null },
  users: {
    type: Map,
    of: [String], // Map<userId, array of removed role IDs>
    default: {},
  },
});

module.exports = mongoose.model("Quarantine", QuarantineSchema);