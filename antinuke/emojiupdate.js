const AntiNukeAndWhitelist = require('../database/Antinuke');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'emojiUpdate',
  execute: async (oldEmoji, newEmoji) => {
    const guildId = oldEmoji.guild.id;

    // Fetch guild settings
    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });

    if (!guildSettings || !guildSettings.enabled) return; // Anti-Nuke is not enabled.

    // Fetch the audit log entry for emoji update
    const auditLogs = await oldEmoji.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.EmojiUpdate,
    });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    const executor = logEntry.executor;

    // Ignore actions by the bot itself
    if (executor.id === oldEmoji.guild.client.user.id) return;

    // Check if the user has `update_emoji` permission
    const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
    const canUpdateEmoji = userSettings?.actions?.update_emoji || false;

    if (executor.id === oldEmoji.guild.ownerId || canUpdateEmoji) {
      // If the user is the guild owner or has permission
      return;
    }

    // Revert the emoji changes and ban the executor
    try {
      await newEmoji.edit({ name: oldEmoji.name }, 'Anti-Nuke: Unauthorized emoji update');
      await oldEmoji.guild.members.ban(executor.id, { reason: 'Anti-Nuke: Unauthorized emoji update' });
    } catch (err) {
      console.error(`Error during emoji update handling: ${err.message}`);
    }
  },
};