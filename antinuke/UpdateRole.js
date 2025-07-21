const AntiNukeAndWhitelist = require('../database/Antinuke');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'roleUpdate',
  execute: async (oldRole, newRole) => {
    const guildId = oldRole.guild.id;

    // Fetch guild settings
    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });

    if (!guildSettings || !guildSettings.enabled) return; // Anti-nuke is not enabled for this guild.

    // Fetch the audit log entry for the role update
    const auditLogs = await oldRole.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.RoleUpdate,
    });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    const executor = logEntry.executor;

    // Ignore actions by the bot itself
    if (executor.id === oldRole.guild.client.user.id) return;

    // Check if the user has `update_role` permission
    const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
    const canUpdateRole = userSettings?.actions?.update_role || false;

    if (executor.id === oldRole.guild.ownerId || canUpdateRole) {
      // If the user is the guild owner or has permission for `update_role`
      return;
    }

    // Revert all changes to the role
    try {
      await newRole.edit({
        name: oldRole.name, // Revert name
        color: oldRole.color, // Revert color
        permissions: oldRole.permissions, // Revert permissions
        hoist: oldRole.hoist, // Revert hoist setting
        mentionable: oldRole.mentionable, // Revert mentionable setting
      });

      // Ban the executor for unauthorized role update
      await oldRole.guild.members.ban(executor.id, { reason: 'Anti-Nuke: Unauthorized role update' });
    } catch (err) {
      console.error(`[error] role update handling: ${err.message}`);
    }
  },
};