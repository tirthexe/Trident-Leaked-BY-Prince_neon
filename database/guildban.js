const mongoose = require("mongoose");

const guildBanSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  guildName: { type: String, required: true },
  bannedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GuildBan", guildBanSchema);