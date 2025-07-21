const mongoose = require("mongoose");

const autoResponseSchema = new mongoose.Schema({
  guildId: String,
  triggers: [
    {
      trigger: String,
      reply: String,
      autodel: { type: Number, default: null }
    }
  ]
});

module.exports = mongoose.model("AutoResponse", autoResponseSchema);