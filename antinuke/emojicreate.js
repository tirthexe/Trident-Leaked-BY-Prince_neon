const AntiNukeAndWhitelist = require('../database/Antinuke');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'emojiCreate',
  execute: async (emoji) => {
    const guildId = emoji.guild.id;

    // Fetch guild settings
    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });

    if (!guildSettings || !guildSettings.enabled) return; // Anti-Nuke is not enabled.

    // Fetch the audit log entry for emoji creation
    const auditLogs = await emoji.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.EmojiCreate,
    });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    const executor = logEntry.executor;

    // Ignore actions by the bot itself
    if (executor.id === emoji.guild.client.user.id) return;

    // Check if the user has `create_emoji` permission
    const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
    const canCreateEmoji = userSettings?.actions?.create_emoji || false;

    if (executor.id === emoji.guild.ownerId || canCreateEmoji) {
      // If the user is the guild owner or has permission
      return;
    }

    // Delete the newly created emoji and ban the executor
    try {
      await emoji.delete('Anti-Nuke: Unauthorized emoji creation');
      await emoji.guild.members.ban(executor.id, { reason: 'Anti-Nuke: Unauthorized emoji creation' });
    } catch (err) {
      console.error(`Error during emoji creation handling: ${err.message}`);
    }
  },
};