const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');
const VoiceCount = require('../../database/voicecount');
const MessageCount = require('../../database/messagecount');
const { createEmbed } = require('../../embed');
const emoji = require('../../emoji');

module.exports = {
  name: 'lbweek',
  aliases: ['weeklylb', 'wlb'],
  description: 'Shows weekly leaderboard for messages or voice time.',
  usage: 'lbweek msg|voice',
  async execute(client, message, args) {
    const type = args[0]?.toLowerCase();
    const validMsg = ['msg', 'm', 'messages'];
    const validVoice = ['voice', 'v', 'vc'];

    if (!type || (!validMsg.includes(type) && !validVoice.includes(type))) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | Please provide a valid type: \`msg\` or \`voice\`.`, message.author, client, null)]
      });
    }

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

    const isMsg = validMsg.includes(type);
    const db = isMsg ? MessageCount : VoiceCount;
    const guildData = await db.findOne({ guildId: message.guild.id });

    if (!guildData || !guildData.users || !guildData.users.length) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | No ${isMsg ? 'message' : 'voice'} data found for this server.`, message.author, client, null)]
      });
    }

    const leaderboard = guildData.users
      .filter(u => u.week && u.week > 0)
      .sort((a, b) => b.week - a.week);

    if (!leaderboard.length) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | No weekly ${isMsg ? 'messages' : 'voice'} recorded.`, message.author, client)]
      });
    }

    const perPage = 15;
    let page = 0;
    const totalPages = Math.ceil(leaderboard.length / perPage);

    const getPageEmbed = (pg) => {
      const start = pg * perPage;
      const end = start + perPage;
      const slice = leaderboard.slice(start, end);

      let desc = slice.map((u, i) => {
  const member = message.guild.members.cache.get(u.userId);
  const rank = start + i + 1;
  let medal = emoji.dot;

  if (rank === 1) medal = emoji.lb1;
  else if (rank === 2) medal = emoji.lb2;
  else if (rank === 3) medal = emoji.lb3;

  return `${medal} **${rank}.** ${member || `<@${u.userId}>`} = \`${
    isMsg ? `${u.week} messages` : formatSeconds(u.week)
  }\``;
}).join('\n');

      return new EmbedBuilder()
        .setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setTitle(`${isMsg ? 'Messages' : 'Voice'} Weekly Leaderboard`)
        .setDescription(desc)
        .setFooter({
          text: 'TRIDENT ❤️ DEVELOPMENT',
          iconURL: client.user.displayAvatarURL({ dynamic: true })
        })
        .setColor('#00FFFF');
    };

    const generateButtons = (pg) =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('weekfirst')
          .setEmoji(emoji.first)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pg === 0),
        new ButtonBuilder()
          .setCustomId('weekprev')
          .setEmoji(emoji.previous)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(pg === 0),
        new ButtonBuilder()
          .setCustomId('weekcancel')
          .setEmoji(emoji.cancel)
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('weeknext')
          .setEmoji(emoji.next)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(pg === totalPages - 1),
        new ButtonBuilder()
          .setCustomId('weeklast')
          .setEmoji(emoji.last)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pg === totalPages - 1)
      );

    const msg = await message.reply({
      embeds: [getPageEmbed(page)],
      components: [generateButtons(page)]
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60000
    });

    collector.on('collect', async (i) => {
      if (i.customId === 'weekcancel') return collector.stop();
      if (i.customId === 'weekfirst') page = 0;
      if (i.customId === 'weekprev' && page > 0) page--;
      if (i.customId === 'weeknext' && page < totalPages - 1) page++;
      if (i.customId === 'weeklast') page = totalPages - 1;

      await i.update({
        embeds: [getPageEmbed(page)],
        components: [generateButtons(page)]
      });
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  }
};