const mongoose = require("mongoose");

const giveawaySchema = new mongoose.Schema({
  guildId: String,
  channelId: String,
  messageId: String,
  prize: String,
  winnerCount: Number,
  endTime: Date,
  hostedBy: String, // NEW FIELD: store host's user ID
});

module.exports = mongoose.model("Giveaway", giveawaySchema);
