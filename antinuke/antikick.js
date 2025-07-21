const AntiNukeAndWhitelist = require('../database/Antinuke');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'guildMemberRemove',
  execute: async (member) => {
    const guildId = member.guild.id;

    // Fetch guild settings
    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });

    if (!guildSettings || !guildSettings.enabled) return; // Anti-nuke is not enabled for this guild.

    // Fetch the audit log for kick event only
    const auditLogs = await member.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberKick,
    });
    
    const logEntry = auditLogs.entries.first();
    
    if (!logEntry || logEntry.target.id !== member.id) return; // If it's not a kick event or the member is not the one being kicked.

    const executor = logEntry.executor;

    // Ignore actions by the bot itself
    if (executor.id === member.guild.client.user.id) return;

    // Check if the user has the `kick` permission
    const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
    const canKickMembers = userSettings?.actions?.kick || false;

    if (executor.id === member.guild.ownerId || canKickMembers) {
      // If the user is the guild owner or has permission for `kick`
      return;
    }

    // Ban the executor for unauthorized kick action
    try {
      await member.guild.members.ban(executor.id, { reason: 'Anti-Nuke: Unauthorized member kick' });
    } catch (err) {
      console.error(`Error during member kick handling: ${err.message}`);
    }
  },
};