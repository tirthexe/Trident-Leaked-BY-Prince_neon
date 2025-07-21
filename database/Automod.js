const mongoose = require('mongoose');

const automodSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  punishment: {
    type: String,
    enum: ['kick', 'ban', 'warn', 'mute'],
    default: 'mute',
  },
  muteDuration: { type: String, default: '2m' },
  whitelist: {
    antispam: {
      users: { type: [String], default: [] },
      channels: { type: [String], default: [] },
      categories: { type: [String], default: [] },
      roles: {type: [String], default: [] },
    },
    antimention: {
      users: { type: [String], default: [] },
      channels: { type: [String], default: [] },
      categories: { type: [String], default: [] },
      roles: {type: [String], default: [] },
    },
    antilink: {
      users: { type: [String], default: [] },
      channels: { type: [String], default: [] },
      categories: { type: [String], default: [] },
      roles: {type: [String], default: [] },
    },
    antiad: {
      users: { type: [String], default: [] },
      channels: { type: [String], default: [] },
      categories: { type: [String], default: [] },
      roles: {type: [String], default: [] },
    },
  },
  antispam: { type: Boolean, default: true },
  antilink: { type: Boolean, default: true },
  antiad: { type: Boolean, default: true },
  antimention: { type: Boolean, default: true },
  logChannel: { type: String, default: null },
});

module.exports = mongoose.model('Automod', automodSchema);