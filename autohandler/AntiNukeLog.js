const { AuditLogEvent } = require('discord.js');
const AntiNukeLog = require('../database/AntiNukeLog');
const emoji = require('../emoji');

module.exports = async (client) => {
  client.on('guildBanAdd', async (ban) => {
    const { guild, user } = ban;

    // Fetch log channel from database
    const logData = await AntiNukeLog.findOne({ guildId: guild.id });
    if (!logData || !logData.logChannelId) return; // No log channel set, do nothing

    // Fetch audit logs for the ban event
    const auditLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
    const banLog = auditLogs.entries.first();

    if (!banLog) return; // No audit log entry found, exit

    const { executor, target, reason } = banLog;
    if (executor.bot && reason && reason.includes('Anti-Nuke:')) {
      const logChannel = guild.channels.cache.get(logData.logChannelId);
      if (!logChannel) return; // Log channel might have been deleted, exit

      // Create the embed message
      const embed = {
        color: 0xFF0000,
        title: `${emoji.error} **ANTINUKE ALERT** ${emoji.error}`,
        description: `**User:** ${target.tag} [\`${target.id}\`]\n**Reason:** ${reason}`,
        timestamp: new Date(),
      };

      // Send the embed to the log channel
      logChannel.send({ embeds: [embed] });
    }
  });
};