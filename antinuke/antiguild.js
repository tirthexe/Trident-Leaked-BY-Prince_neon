const AntiNukeAndWhitelist = require('../database/Antinuke');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'guildUpdate',
  execute: async (oldGuild, newGuild) => {
    const guildId = oldGuild.id;

    // Fetch guild settings
    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });

    if (!guildSettings || !guildSettings.enabled) return; // Anti-Nuke is not enabled for this guild.

    // Fetch the audit log entry for guild updates
    const auditLogs = await oldGuild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.GuildUpdate,
    });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    const executor = logEntry.executor;

    // Ignore actions by the bot itself
    if (executor.id === oldGuild.client.user.id) return;

    // Check if the user has `guild_update` permission
    const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
    const canUpdateGuild = userSettings?.actions?.guild_update || false;

    if (executor.id === oldGuild.ownerId || canUpdateGuild) {
      // If the user is the guild owner or has permission
      return;
    }

    // Revert guild changes and ban the executor
    try {
      // Revert server name change
      if (oldGuild.name !== newGuild.name) {
        await newGuild.setName(oldGuild.name, 'Anti-Nuke: Unauthorized server name change');
      }

      // Revert server icon
      if (oldGuild.icon !== newGuild.icon) {
        await newGuild.setIcon(oldGuild.iconURL(), 'Anti-Nuke: Unauthorized icon change');
      }

      // Revert banner
      if (oldGuild.banner !== newGuild.banner) {
        await newGuild.setBanner(oldGuild.bannerURL(), 'Anti-Nuke: Unauthorized banner change');
      }

      // Revert server description
      if (oldGuild.description !== newGuild.description) {
        await newGuild.edit(
          { description: oldGuild.description },
          'Anti-Nuke: Unauthorized description change'
        );
      }

      // Ban the executor for unauthorized actions
      await newGuild.members.ban(executor.id, { reason: 'Anti-Nuke: Unauthorized guild update' });
    } catch (err) {
      console.error(`Error during guild update handling: ${err.message}`);
    }
  },
};