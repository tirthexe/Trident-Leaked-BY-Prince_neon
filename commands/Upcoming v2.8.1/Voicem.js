const { PermissionsBitField } = require('discord.js');
const VoiceCount = require('../../database/voicecount');
const { createEmbed } = require('../../embed');
const emoji = require('../../emoji');

module.exports = {
  name: 'voice',
  aliases: ['v'],
  description: 'Show or modify voice activity time for users',
  async execute(client, message, args) {
    const executor = message.author;

    // Helper: format seconds into d h m s
    const formatSeconds = (seconds) => {
      seconds = Math.floor(seconds || 0);
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      const parts = [];
      if (d) parts.push(`${d}d`);
      if (h) parts.push(`${h}h`);
      if (m) parts.push(`${m}m`);
      if (s) parts.push(`${s}s`);
      return parts.length ? parts.join(' ') : '0s';
    };

    // Helper: parse time string like "1s", "3m", "2h", "1d", "1w"
    const parseTimeToSeconds = (input) => {
      if (!input) return 0;
      input = input.toLowerCase().trim();
      const regex = /^(\d+)(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks)?$/;
      const match = input.match(regex);
      if (!match) return NaN;
      const value = parseInt(match[1]);
      const unit = match[2];

      switch (unit) {
        case 's': case 'sec': case 'secs': case 'second': case 'seconds': return value;
        case 'm': case 'min': case 'mins': case 'minute': case 'minutes': return value * 60;
        case 'h': case 'hr': case 'hrs': case 'hour': case 'hours': return value * 3600;
        case 'd': case 'day': case 'days': return value * 86400;
        case 'w': case 'week': case 'weeks': return value * 604800;
        default: return value;
      }
    };

    // Permission check for subcommands
    const hasPermission = () => {
      if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
      return message.member.roles.cache.some(r => r.name.toLowerCase() === 'TRUDENT ADMIN');
    };

    let guildData = await VoiceCount.findOne({ guildId: message.guild.id });
    if (!guildData) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | Voice count system is disabled or not configured in this server.`, executor, client)],
      });
    }

    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'help') {
      const helpEmbed = createEmbed(
        '#00FFFF',
        `**Voice Command Help**\n\n` +
        `\`v [user]\` — Show voice stats for a user or yourself\n` +
        `\`v add <user> <amount>\` — Add voice time (Admin only)\n` +
        `\`v remove <user> <amount>\` — Remove voice time (Admin only)\n` +
        `\`v reset <user|all>\` — Reset voice data for user or all (Admin only)`,
        executor,
        client
      );
      return message.reply({ embeds: [helpEmbed] });
    }

    if (subcommand === 'add') {
      if (!hasPermission()) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | You need Administrator or TRIDENT ADMIN role to use this command.`, executor, client)],
        });
      }
      if (args.length < 3) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | Usage: v add <user> <amount>`, executor, client)],
        });
      }
      const target = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
      if (!target) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | User not found.`, executor, client)],
        });
      }
      const secondsToAdd = parseTimeToSeconds(args[2]);
      if (isNaN(secondsToAdd) || secondsToAdd <= 0) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | Invalid amount. Use formats like 1s, 5m, 2h, 1d, 1w.`, executor, client)],
        });
      }

      let userData = guildData.users.find(u => u.userId === target.id);
      if (!userData) {
        userData = { userId: target.id, allTime: 0, week: 0, yesterday: 0, today: 0 };
        guildData.users.push(userData);
      }
      userData.allTime += secondsToAdd;
      await guildData.save();

      return message.reply({
        embeds: [createEmbed('#00FF00', `${emoji.success} | Added \`${formatSeconds(secondsToAdd)}\` to ${target}'s all-time voice time.`, executor, client)],
      });
    }

    if (subcommand === 'remove') {
      if (!hasPermission()) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | You need Administrator or TRIDENT ADMIN role to use this command.`, executor, client)],
        });
      }
      if (args.length < 3) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | Usage: v remove <user> <amount>`, executor, client)],
        });
      }
      const target = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
      if (!target) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | User not found.`, executor, client)],
        });
      }
      const secondsToRemove = parseTimeToSeconds(args[2]);
      if (isNaN(secondsToRemove) || secondsToRemove <= 0) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | Invalid amount. Use formats like 1s, 5m, 2h, 1d, 1w.`, executor, client)],
        });
      }

      let userData = guildData.users.find(u => u.userId === target.id);
      if (!userData || !userData.allTime) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | No voice data found for ${target}.`, executor, client)],
        });
      }
      if (userData.allTime < secondsToRemove) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | ${target} doesn't have enough voice time to remove.`, executor, client)],
        });
      }

      userData.allTime -= secondsToRemove;
      userData.month = Math.max(0, (userData.month || 0) - secondsToRemove);
      userData.week = Math.max(0, (userData.week || 0) - secondsToRemove);
      userData.yesterday = Math.max(0, (userData.yesterday || 0) - secondsToRemove);
      userData.today = Math.max(0, (userData.today || 0) - secondsToRemove);
      await guildData.save();

      return message.reply({
        embeds: [createEmbed('#00FF00', `${emoji.success} | Removed \`${formatSeconds(secondsToRemove)}\` from ${target}'s voice data (all-time, week, yesterday, today).`, executor, client)],
      });
    }

    if (subcommand === 'reset') {
      if (!hasPermission()) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | You need Administrator or TRIDENT ADMIN role to use this command.`, executor, client)],
        });
      }
      if (args.length < 2) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | Usage: v reset <user|all>`, executor, client)],
        });
      }

      if (args[1].toLowerCase() === 'all') {
        guildData.users = [];
        await guildData.save();
        return message.reply({
          embeds: [createEmbed('#00FF00', `${emoji.success} | All voice data has been reset for this server.`, executor, client)],
        });
      } else {
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
        if (!target) {
          return message.reply({
            embeds: [createEmbed('#FF0000', `${emoji.error} | User not found.`, executor, client)],
          });
        }
        const userIndex = guildData.users.findIndex(u => u.userId === target.id);
        if (userIndex === -1) {
          return message.reply({
            embeds: [createEmbed('#FF0000', `${emoji.error} | No voice data found for ${target}.`, executor, client)],
          });
        }
        guildData.users.splice(userIndex, 1);
        await guildData.save();

        return message.reply({
          embeds: [createEmbed('#00FF00', `${emoji.success} | Voice data reset for ${target}.`, executor, client)],
        });
      }
    }

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
    const userData = guildData.users.find(u => u.userId === target.id);
    if (!userData) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | No voice data found for ${target}.`, executor, client)],
      });
    }

    const allTimeSec = userData.allTime || 0;
    const monthSec = userData.month || 0;
    const weekSec = userData.week || 0;
    const yesterdaySec = userData.yesterday || 0;
    const todaySec = userData.today || 0;
    const avgPerDaySec = Math.floor(weekSec / 7);

    const embed = createEmbed(
      '#00FFFF',
      `**Voice Activity for ${target}**\n\n` +
      `> ${emoji.dot} **All time:** ${formatSeconds(allTimeSec)}\n` +
      `> ${emoji.dot} **This month:** ${formatSeconds(monthSec)}\n` +
      `> ${emoji.dot} **This week:** ${formatSeconds(weekSec)}\n\n` +
      `${emoji.category} **__ EXTRA __ \n\n` +
      `> ${emoji.dot} **Yesterday:** ${formatSeconds(yesterdaySec)}\n` +
      `> ${emoji.dot} **Today:** ${formatSeconds(todaySec)}\n\n` +
      `${emoji.arrow} **AVERAGE:** ${formatSeconds(avgPerDaySec)} per day (weekly)`,
      executor,
      client
    );

    return message.reply({ embeds: [embed] });
  },
};