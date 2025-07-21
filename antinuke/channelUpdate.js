const AntiNukeAndWhitelist = require('../database/Antinuke');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'channelUpdate',
  execute: async (oldChannel, newChannel) => {
    const guildId = oldChannel.guild.id;

    // Fetch guild settings
    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });

    if (!guildSettings || !guildSettings.enabled) return; // Anti-nuke is not enabled for this guild.

    // Fetch the audit log entry for the channel update
    const auditLogs = await oldChannel.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.ChannelUpdate,
    });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    const executor = logEntry.executor;

    // Ignore actions by the bot itself
    if (executor.id === oldChannel.guild.client.user.id) return;

    // Check if the user has `update_channel` permission
    const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
    const canUpdateChannel = userSettings?.actions?.update_channel || false;

    if (executor.id === oldChannel.guild.ownerId || canUpdateChannel) {
      // If the user is the guild owner or has permission for `update_channel`
      return;
    }

    // Revert all changes to the channel
    try {
      await newChannel.edit({
        name: oldChannel.name, // Revert name
        topic: oldChannel.topic, // Revert topic (if applicable)
        nsfw: oldChannel.nsfw, // Revert NSFW setting (if applicable)
        bitrate: oldChannel.bitrate, // Revert bitrate (for voice channels)
        userLimit: oldChannel.userLimit, // Revert user limit (for voice channels)
        rateLimitPerUser: oldChannel.rateLimitPerUser, // Revert slow mode (for text channels)
        parent: oldChannel.parent, // Revert category
        position: oldChannel.position, // Revert position
      });

      // Ban the executor for unauthorized channel update
      await oldChannel.guild.members.ban(executor.id, { reason: 'Anti-Nuke: Unauthorized channel update' });
    } catch (err) {
      console.error(`Error during channel update handling: ${err.message}`);
    }
  },
};