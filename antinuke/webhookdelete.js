const AntiNukeAndWhitelist = require('../database/Antinuke');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'webhookDelete',
  execute: async (guild) => {
    const guildId = guild.id;

    // Fetch guild settings
    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });
    if (!guildSettings || !guildSettings.enabled) return; // Anti-Nuke is not enabled.

    // Fetch the audit log for webhook deletion
    const auditLogs = await guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.WebhookDelete,
    });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    const { executor } = logEntry;

    // Ignore actions by the bot itself
    if (executor.id === guild.client.user.id) return;

    // Check if the executor has webhook permissions
    const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
    const canManageWebhooks = userSettings?.actions?.webhook || false;

    if (executor.id === guild.ownerId || canManageWebhooks) {
      // If the user is the guild owner or has permission
      return;
    }

    // Handle unauthorized webhook deletion
    try {
      // Ban the executor
      await guild.members.ban(executor.id, { reason: 'Anti-Nuke: Unauthorized webhook deletion' });
    } catch (err) {
      console.error(`Error handling unauthorized webhook deletion: ${err.message}`);
    }
  },
};