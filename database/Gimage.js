const mongoose = require("mongoose");

const gimageSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  image: { type: String, required: true },
});

module.exports = mongoose.model("Gimage", gimageSchema);