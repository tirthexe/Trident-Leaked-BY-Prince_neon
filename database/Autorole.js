const mongoose = require("mongoose");

const AutoroleSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  roles: [{ type: String }],
  vcrole: { type: String, default: null },
});

module.exports = mongoose.model("Autorole", AutoroleSchema);