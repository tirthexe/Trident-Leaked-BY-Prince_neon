const AntiNukeAndWhitelist = require('../database/Antinuke');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'roleCreate',
  execute: async (role) => {
    const guildId = role.guild.id;

    // Fetch guild settings
    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });

    if (!guildSettings || !guildSettings.enabled) return; // Anti-nuke is not enabled for this guild.

    // Fetch the audit log entry for the role creation
    const auditLogs = await role.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.RoleCreate,
    });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    const executor = logEntry.executor;

    // Ignore the bot itself
    if (executor.id === role.guild.client.user.id) return;
 

    // Check if the user has `create_role` permission
    const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
    const canCreateRole = userSettings?.actions?.create_role || false;

    if (executor.id === role.guild.ownerId || canCreateRole) {
      // If the user is the guild owner or has permission for `create_role`
      return;
    }

    // Delete the unauthorized created role and ban the executor
    try {
      await role.delete();
      await role.guild.members.ban(executor.id, { reason: 'Anti-Nuke: Unauthorized role creation' });
    } catch (err) {
      console.error(`Failed to ban user or delete role: ${err.message}`);
    }
  },
};