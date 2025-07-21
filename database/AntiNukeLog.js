const { Schema, model } = require('mongoose');

const AntiNukeLogSchema = new Schema({
  guildId: { type: String, required: true },
  logChannelId: { type: String, required: false }, // Log channel ID, if set
});

module.exports = model('AntiNukeLog', AntiNukeLogSchema);