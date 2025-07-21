const AntiNukeAndWhitelist = require('../database/Antinuke');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'emojiDelete',
  execute: async (emoji) => {
    const guildId = emoji.guild.id;

    // Fetch guild settings
    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });

    if (!guildSettings || !guildSettings.enabled) return; // Anti-Nuke is not enabled.

    // Fetch the audit log entry for emoji deletion
    const auditLogs = await emoji.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.EmojiDelete,
    });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    const executor = logEntry.executor;

    // Ignore actions by the bot itself
    if (executor.id === emoji.guild.client.user.id) return;

    // Check if the user has `delete_emoji` permission
    const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
    const canDeleteEmoji = userSettings?.actions?.delete_emoji || false;

    if (executor.id === emoji.guild.ownerId || canDeleteEmoji) {
      // If the user is the guild owner or has permission
      return;
    }

    // Ban the executor for unauthorized emoji deletion
    try {
      await emoji.guild.members.ban(executor.id, { reason: 'Anti-Nuke: Unauthorized emoji deletion' });
    } catch (err) {
      console.error(`Error during emoji deletion handling: ${err.message}`);
    }
  },
};