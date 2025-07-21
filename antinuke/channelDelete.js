const AntiNukeAndWhitelist = require('../database/Antinuke');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'channelDelete',
  execute: async (channel) => {
    const guildId = channel.guild.id;

    // Fetch guild settings
    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });

    if (!guildSettings || !guildSettings.enabled) return; // Anti-nuke is not enabled for this guild.

    // Fetch the audit log entry for the channel deletion
    const auditLogs = await channel.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.ChannelDelete,
    });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    const executor = logEntry.executor;
    const isOwner = executor.id === channel.guild.ownerId;

    // Check if the user has `delete_channel` allowed
    const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
    const canDeleteChannel = userSettings?.actions?.delete_channel || false;

    if (isOwner || canDeleteChannel) {
      // If the user is the guild owner or has permission for `delete_channel`
      return;
    }

    // Ban the executor and prevent channel deletion
    try {
      await channel.guild.members.ban(executor.id, { reason: 'Anti-Nuke: Unauthorized channel deletion' });
    } catch (err) {
      console.error(`Failed to ban user: ${err.message}`);
    }
  },
};