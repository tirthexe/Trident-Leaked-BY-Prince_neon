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
  name: 'lb',  
  aliases: ['lball', 'alllb'],  
  description: 'Shows all-time leaderboard for messages or voice time.',  
  usage: 'lb msg|voice',  
  async execute(client, message, args) {  
    const type = args[0]?.toLowerCase();  
    const validMsg = ['msg', 'm', 'messages', 'message'];  
    const validVoice = ['voice', 'v', 'vc'];  
  
    if (!type || (!validMsg.includes(type) && !validVoice.includes(type))) {  
      return message.reply({  
        embeds: [createEmbed('#FF0000', `${emoji.error} | Please provide a valid type: \`msg\` or \`voice\`.`, message.author, client)]  
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
        embeds: [createEmbed('#FF0000', `${emoji.error} | No ${isMsg ? 'message' : 'voice'} data found for this server.`, message.author, client)]  
      });  
    }  
  
    const leaderboard = guildData.users  
      .filter(u => u.allTime && u.allTime > 0)  
      .sort((a, b) => b.allTime - a.allTime);  
  
    if (!leaderboard.length) {  
      return message.reply({  
        embeds: [createEmbed('#FF0000', `${emoji.error} | No all-time ${isMsg ? 'messages' : 'voice'} recorded.`, message.author, client)]  
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
        const display = `${isMsg ? `${u.allTime} messages` : formatSeconds(u.allTime)}`;  
        const rank = start + i;  
        const prefix = rank === 0 ? emoji.lb1 : rank === 1 ? emoji.lb2 : rank === 2 ? emoji.lb3 : emoji.dot;  
        return `${prefix} | ${member ? member : `<@${u.userId}>`} = \`${display}\``;  
      }).join('\n');  
  
      return new EmbedBuilder()  
        .setAuthor({  
          name: message.author.tag,  
          iconURL: message.author.displayAvatarURL({ dynamic: true })  
        })  
        .setTitle(`${isMsg ? 'Messages' : 'Voice'} All Time Leaderboard`)  
        .setDescription(desc)  
        .setFooter({  
          text: 'TRIDENT ❤️ DEVELOPMENT',  
          iconURL: client.user.displayAvatarURL({ dynamic: true })  
        })  
        .setColor('#FFD700');  
    };  
  
    const generateButtons = (pg) =>  
      new ActionRowBuilder().addComponents(  
        new ButtonBuilder()  
          .setCustomId('allfirst')  
          .setEmoji(emoji.first)  
          .setStyle(ButtonStyle.Primary)  
          .setDisabled(pg === 0),  
        new ButtonBuilder()  
          .setCustomId('allprev')  
          .setEmoji(emoji.previous)  
          .setStyle(ButtonStyle.Secondary)  
          .setDisabled(pg === 0),  
        new ButtonBuilder()  
          .setCustomId('allcancel')  
          .setEmoji(emoji.cancel)  
          .setStyle(ButtonStyle.Danger),  
        new ButtonBuilder()  
          .setCustomId('allnext')  
          .setEmoji(emoji.next)  
          .setStyle(ButtonStyle.Secondary)  
          .setDisabled(pg === totalPages - 1),  
        new ButtonBuilder()  
          .setCustomId('alllast')  
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
      if (i.customId === 'allcancel') return collector.stop();  
      if (i.customId === 'allfirst') page = 0;  
      if (i.customId === 'allprev' && page > 0) page--;  
      if (i.customId === 'allnext' && page < totalPages - 1) page++;  
      if (i.customId === 'alllast') page = totalPages - 1;  
  
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