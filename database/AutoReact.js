const mongoose = require("mongoose");

const AutoReactSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  reacts: [
    {
      name: { type: String, required: true },
      emoji: { type: String, required: true }
    }
  ]
});

module.exports = mongoose.model("AutoReact", AutoReactSchema);