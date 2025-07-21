const AntiNukeAndWhitelist = require('../database/Antinuke');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'guildBanAdd',
  execute: async (ban) => {
    const guildId = ban.guild.id;

    // Fetch guild settings
    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });

    if (!guildSettings || !guildSettings.enabled) return; // Anti-Nuke is not enabled for this guild.

    // Fetch the audit log entry for the ban
    const auditLogs = await ban.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberBanAdd,
    });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    const executor = logEntry.executor;

    // Ignore actions by the bot itself
    if (executor.id === ban.guild.client.user.id) return;

    // Check if the user has `ban` permission
    const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
    const canBanMembers = userSettings?.actions?.ban || false;

    if (executor.id === ban.guild.ownerId || canBanMembers) {
      // If the user is the guild owner or has permission for `ban`
      return;
    }

    // Ban the executor for unauthorized ban action
    try {
      await ban.guild.members.ban(executor.id, { reason: 'Anti-Nuke: Unauthorized member ban' });
    } catch (err) {
      console.error(`Error during anti-ban handling: ${err.message}`);
    }
  },
};