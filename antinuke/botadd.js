const { AuditLogEvent } = require('discord.js');
const AntiNukeAndWhitelist = require('../database/Antinuke');

module.exports = {
  name: 'guildMemberAdd',
  execute: async (member) => {
    try {
      const guildId = member.guild.id;

      // If the member is a user (not a bot), do nothing
      if (!member.user.bot) {
        return;
      }

      // Fetch guild settings
      const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });

      if (!guildSettings || !guildSettings.enabled) return; // Anti-nuke not enabled for this guild.

      // Fetch the audit log entry for the bot addition
      const auditLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.BotAdd,
      });
      const logEntry = auditLogs.entries.first();
      if (!logEntry) return;

      const executor = logEntry.executor;

      // Ignore actions by the bot itself
      if (executor.id === member.guild.client.user.id) return;

      // Check if the user has permission to add bots
      const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
      const canAddBots = userSettings?.actions?.bot_add || false;

      if (executor.id === member.guild.ownerId || canAddBots) {
        return; // If the user is the guild owner or has permission to add bots
      }

      // Ban the executor for unauthorized bot addition
      await member.guild.members.ban(executor.id, { reason: 'Anti-Nuke: Unauthorized bot addition' });

      // Ban the bot that was added by the unauthorized member
      await member.guild.members.ban(member.id, { reason: 'Unauthorized bot added by member' });

    } catch (err) {
      // Log only errors to the console
      console.error(`Error during bot addition handling: ${err.message}`);
    }
  },
};