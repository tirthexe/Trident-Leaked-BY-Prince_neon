const AntiNukeAndWhitelist = require('../database/Antinuke');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'channelCreate',
  execute: async (channel) => {
    const guildId = channel.guild.id;

    // Fetch guild settings
    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });

    if (!guildSettings || !guildSettings.enabled) return; // Anti-nuke is not enabled for this guild.

    // Fetch the audit log entry for the channel creation
    const auditLogs = await channel.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.ChannelCreate,
    });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    const executor = logEntry.executor;
    const isOwner = executor.id === channel.guild.ownerId;

    // Check if the user has `create_channel` allowed
    const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
    const canCreateChannel = userSettings?.actions?.create_channel || false;

    if (isOwner || canCreateChannel) {
      // If the user is the guild owner or has permission for `create_channel`
      return;
    }

    // Ban the executor and delete the unauthorized channel
    try {
      await channel.guild.members.ban(executor.id, { reason: 'Trident: Unauthorized channel creation' });
      await channel.delete();
    } catch (err) {
      console.error(`Failed to ban user or delete channel: ${err.message}`);
    }
  },
};