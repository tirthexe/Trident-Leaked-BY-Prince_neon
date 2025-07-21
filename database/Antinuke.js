const mongoose = require('mongoose');

const AntiNukeAndWhitelistSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  enabled: {
    type: Boolean,
    default: false,
  },
  users: [
    {
      userId: { type: String, required: true },
      actions: {
        create_channel: { type: Boolean, default: false },
        delete_channel: { type: Boolean, default: false },
        update_channel: { type: Boolean, default: false },
        create_role: { type: Boolean, default: false },
        delete_role: { type: Boolean, default: false },
        update_role: { type: Boolean, default: false },
        member_role_update: { type: Boolean, default: false },
        ban: { type: Boolean, default: false },
        kick: { type: Boolean, default: false },
        create_emoji: { type: Boolean, default: false },
        update_emoji: { type: Boolean, default: false },
        delete_emoji: { type: Boolean, default: false },
        mention: { type: Boolean, default: false },
        webhook: { type: Boolean, default: false },
        guild_update: { type: Boolean, default: false },
        bot_add: { type: Boolean, default: false },
        create_event: { type: Boolean, default: false },
        delete_event: { type: Boolean, default: false },
        update_event: { type: Boolean, default: false },
        create_automod: { type: Boolean, default: false },
        update_automod: { type: Boolean, default: false },
        delete_automod: { type: Boolean, default: false },
        antipurne: { type: Boolean, default: false },
      },
    },
  ],
  extraOwners: [{ type: String }],
});

module.exports = mongoose.model('AntiNukeAndWhitelist', AntiNukeAndWhitelistSchema);