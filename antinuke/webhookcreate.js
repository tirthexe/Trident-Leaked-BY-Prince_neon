const AntiNukeAndWhitelist = require('../database/Antinuke');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'webhookUpdate',
  execute: async (channel) => {
    const guild = channel.guild;
    const guildId = guild.id;

    // Fetch guild settings
    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });
    if (!guildSettings || !guildSettings.enabled) return;

    try {
      // Fetch the audit log for webhook creation
      const auditLogs = await guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.WebhookCreate,
      });

      const logEntry = auditLogs.entries.first();
      if (!logEntry) return;

      const { executor, target } = logEntry;

      // Ignore actions by the bot itself
      if (executor.id === guild.client.user.id) return;

      // Check if the executor has webhook permissions
      const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
      const canManageWebhooks = userSettings?.actions?.webhook || false;

      if (executor.id === guild.ownerId || canManageWebhooks) return;

      // Ban the executor for unauthorized webhook creation
      await guild.members.ban(executor.id, { reason: 'Anti-Nuke: Unauthorized webhook creation' });

      // Delete the webhook
      const webhook = await guild.fetchWebhook(target.id);
      if (webhook) await webhook.delete('Anti-Nuke: Unauthorized webhook creation');
    } catch (err) {
      console.error(`Error handling webhook creation: ${err.message}`);
    }
  },
};