const mongoose = require('mongoose');

const automodSchema = new mongoose.Schema({
guildId: { type: String, required: true, unique: true },
enabled: { type: Boolean, default: false },
punishment: {
type: String,
enum: ['kick', 'ban', 'warn', 'mute'],
default: 'warn',
},
muteDuration: { type: String, default: '10m' },
whitelist: {
users: { type: [String], default: [] },
channels: { type: [String], default: [] },
categories: { type: [String], default: [] },
},
antispam: { type: Boolean, default: true },
antilink: { type: Boolean, default: true },
antiad: { type: Boolean, default: true },
antimention: { type: Boolean, default: true },
});

module.exports = mongoose.model('Automod', automodSchema);