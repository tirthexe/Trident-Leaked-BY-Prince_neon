const AntiNukeAndWhitelist = require('../database/Antinuke');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'roleDelete',
  execute: async (role) => {
    const guildId = role.guild.id;

    // Fetch guild settings
    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });

    if (!guildSettings || !guildSettings.enabled) return; // Anti-nuke is not enabled for this guild.

    // Fetch the audit log entry for the role deletion
    const auditLogs = await role.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.RoleDelete,
    });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    const executor = logEntry.executor;

    // Ignore the bot itself
    if (executor.id === role.guild.client.user.id) return;
 

    // Check if the user has `delete_role` permission
    const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
    const canDeleteRole = userSettings?.actions?.delete_role || false;

    if (executor.id === role.guild.ownerId || canDeleteRole) {
      // If the user is the guild owner or has permission for `delete_role`
      return;
    }

    // Recreate the role with the same properties
    try {
      await role.guild.roles.create({
        name: role.name,
        permissions: role.permissions,
        position: role.position,
        color: role.color,
        hoist: role.hoist,
        mentionable: role.mentionable,
      });

      // Ban the user who deleted the role
      await role.guild.members.ban(executor.id, { reason: 'Anti-Nuke: Unauthorized role deletion' });
    } catch (err) {
      console.error(`Failed to ban user or recreate role: ${err.message}`);
    }
  },
};