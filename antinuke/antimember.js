const AntiNukeAndWhitelist = require('../database/Antinuke');
const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'guildMemberUpdate',
  execute: async (oldMember, newMember) => {
    const guildId = oldMember.guild.id;

    // Fetch Anti-Nuke settings for the guild
    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });
    if (!guildSettings || !guildSettings.enabled) return; // Anti-Nuke not enabled.

    // Detect role changes
    const addedRoles = newMember.roles.cache.difference(oldMember.roles.cache); // Roles added
    const removedRoles = oldMember.roles.cache.difference(newMember.roles.cache); // Roles removed

    // Skip if no roles were added or removed
    if (addedRoles.size === 0 && removedRoles.size === 0) return;

    // Fetch audit logs
    const auditLogs = await oldMember.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberRoleUpdate,
    });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    const executor = logEntry.executor;

    // Ignore bot's own actions
    if (executor.id === oldMember.guild.client.user.id) return;

    // Check if the executor is whitelisted
    const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
    const isWhitelisted = executor.id === oldMember.guild.ownerId || userSettings?.actions?.member_role_update;

    if (isWhitelisted) return; // Skip whitelisted users or the server owner

    // Dangerous permissions array
    const dangerousPermissions = [
      PermissionFlagsBits.ManageEvents,
      PermissionFlagsBits.ManageEmojisAndStickers,
      PermissionFlagsBits.ManageGuild,
      PermissionFlagsBits.ManageRoles,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ViewAuditLog,
      PermissionFlagsBits.ManageWebhooks,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.Administrator,
      PermissionFlagsBits.MuteMembers,
    ];

    try {
      // Handle Role Additions (dangerous roles being added)
      if (addedRoles.size > 0) {
        const hasDangerousAdditions = addedRoles.some(role =>
          dangerousPermissions.some(permission => role.permissions.has(permission))
        );

        if (hasDangerousAdditions) {
          // Remove the dangerous role
          await newMember.roles.remove(addedRoles, 'Anti-Nuke: Unauthorized dangerous role addition');

          // Ban the executor
          await oldMember.guild.members.ban(executor.id, {
            reason: 'Anti-Nuke: Unauthorized dangerous role addition',
          });
        }
      }

      // Handle Role Removals (dangerous roles being removed)
      if (removedRoles.size > 0) {
        const hasDangerousRemovals = removedRoles.some(role =>
          dangerousPermissions.some(permission => role.permissions.has(permission))
        );

        if (hasDangerousRemovals) {
          // Ban the executor without re-adding the role
          await oldMember.guild.members.ban(executor.id, {
            reason: 'Anti-Nuke: Unauthorized dangerous role removal',
          });
        }
      }
    } catch (err) {
      console.error(`[Anti-Nuke Error] ${err.message}`);
    }
  },
};