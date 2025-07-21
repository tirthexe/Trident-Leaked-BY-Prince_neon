const {
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType,
  PermissionsBitField
} = require('discord.js');
const LiveLeaderboard = require('../../database/liveleaderboard');
const MessageCount = require('../../database/messagecount');
const VoiceCount = require('../../database/voicecount');
const { createEmbed } = require('../../embed');
const emoji = require('../../emoji');

function formatSecondsToHMS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function getTimeKey(type) {
  switch (type) {
    case 'daily': return 'today';
    case 'weekly': return 'week';
    case 'monthly': return 'month';
    case 'all': return 'allTime';
    default: return 'allTime';
  }
}

function getMidField(val) {
  return (
    val === 'msg_daily' ? 'messagesDailyMid' :
    val === 'msg_weekly' ? 'messagesWeeklyMid' :
    val === 'msg_monthly' ? 'messagesMonthlyMid' :
    val === 'msg_all' ? 'messagesAllMid' :
    val === 'vc_daily' ? 'voiceDailyMid' :
    val === 'vc_weekly' ? 'voiceWeeklyMid' :
    val === 'vc_monthly' ? 'voiceMonthlyMid' :
    val === 'vc_all' ? 'voiceAllMid' : null
  );
}

module.exports = {
  name: 'liveleaderboard',
  aliases: ['livelb'],
  description: 'Setup live leaderboard system.',

  async execute(client, message, args) {
    const executor = message.author;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | You must be an admin to use this command.`, executor, client, null)],
      });
    }

    const channelInput = args[0]?.replace(/[<#>]/g, '');
    const channel = message.guild.channels.cache.get(channelInput);

    if (!channel || channel.type !== ChannelType.GuildText) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | Please mention a valid text channel.`, executor, client, null)]
      });
    }

    const botPerms = channel.permissionsFor(message.guild.members.me);
    if (!botPerms.has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | I need Send Messages and Embed Links permissions in ${channel} to post the leaderboard.`, executor, client, null)]
      });
    }

    const buttonsRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('lb_messages').setLabel('Messages LB').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('lb_voice').setLabel('Voice LB').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('lb_both').setLabel('Both').setStyle(ButtonStyle.Success)
    );

    const mainMsg = await message.reply({
      embeds: [createEmbed('#00AAFF', `Want to add a live leaderboard? Please choose one below.`, executor, client, null)],
      components: [buttonsRow]
    });

    const buttonInteraction = await mainMsg.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: 60_000
    }).catch(() => null);

    if (!buttonInteraction || buttonInteraction.user.id !== executor.id) return;

    const choice = buttonInteraction.customId;
    const isMessages = choice === 'lb_messages' || choice === 'lb_both';
    const isVoice = choice === 'lb_voice' || choice === 'lb_both';

    const dropdownOptions = [];

    if (isMessages) {
      dropdownOptions.push(
        { label: 'Daily Messages', value: 'msg_daily' },
        { label: 'Weekly Messages', value: 'msg_weekly' },
        { label: 'Monthly Messages', value: 'msg_monthly' },
        { label: 'All Time Messages', value: 'msg_all' },
      );
    }
    if (isVoice) {
      dropdownOptions.push(
        { label: 'Daily Voice', value: 'vc_daily' },
        { label: 'Weekly Voice', value: 'vc_weekly' },
        { label: 'Monthly Voice', value: 'vc_monthly' },
        { label: 'All Time Voice', value: 'vc_all' },
      );
    }

    const selectMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_lbs')
        .setMinValues(1)
        .setMaxValues(dropdownOptions.length)
        .setPlaceholder('Select leaderboard types to enable')
        .addOptions(dropdownOptions)
    );

    await buttonInteraction.update({
      embeds: [createEmbed('#00AAFF', `Choose the leaderboard time ranges to enable for ${isMessages && isVoice ? 'Messages & Voice' : isMessages ? 'Messages' : 'Voice'}.`, executor, client, null)],
      components: [selectMenu]
    });

    const selection = await mainMsg.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      time: 60_000
    }).catch(() => null);

    if (!selection || selection.user.id !== executor.id) return;

    let data = await LiveLeaderboard.findOne({ guildId: message.guild.id }) || new LiveLeaderboard({ guildId: message.guild.id });

    for (const val of selection.values) {
      if (val === 'msg_daily') data.messagesDaily = channel.id;
      if (val === 'msg_weekly') data.messagesWeekly = channel.id;
      if (val === 'msg_monthly') data.messagesMonthly = channel.id;
      if (val === 'msg_all') data.messagesAll = channel.id;

      if (val === 'vc_daily') data.voiceDaily = channel.id;
      if (val === 'vc_weekly') data.voiceWeekly = channel.id;
      if (val === 'vc_monthly') data.voiceMonthly = channel.id;
      if (val === 'vc_all') data.voiceAll = channel.id;
    }

    await data.save();

    await selection.update({
      embeds: [createEmbed('#00FF00', `${emoji.tick} | Successfully configured the following leaderboards:\n\n${selection.values.map(v => `• ${v.replace(/_/g, ' ')}`).join('\n')}`, executor, client, null)],
      components: []
    });

    for (const val of selection.values) {
      const isMessageLB = val.startsWith('msg_');
      const type = val.split('_')[1];
      const timeKey = getTimeKey(type);

      let leaderboardData = [];
      let titleTime = type.toUpperCase();
      let lbType = isMessageLB ? 'MESSAGE' : 'VOICE';

      if (isMessageLB) {
        const guildData = await MessageCount.findOne({ guildId: message.guild.id });
        if (!guildData) continue;

        leaderboardData = guildData.users
          .filter(u => !guildData.blacklist.users.includes(u.userId) && !guildData.blacklist.channels.includes(channel.id))
          .map(u => ({
            userId: u.userId,
            value: u[timeKey] || 0
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 15);
      } else {
        const guildData = await VoiceCount.findOne({ guildId: message.guild.id });
        if (!guildData) continue;

        leaderboardData = guildData.users
          .filter(u => !guildData.blacklist.users.includes(u.userId) && !guildData.blacklist.channels.includes(channel.id))
          .map(u => ({
            userId: u.userId,
            value: u[timeKey] || 0
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 15);
      }

      if (leaderboardData.length === 0) continue;

      const description = leaderboardData.map((user, i) => {
        const mention = `<@${user.userId}>`;
        const value = isMessageLB ? user.value : formatSecondsToHMS(user.value);
        return `**${i + 1}.** ${mention} = ${value}`;
      }).join('\n');

      const embed = createEmbed('#00FFFF', `**${titleTime} ${lbType} LIVE LEADERBOARD**\n\n${description}`, executor, client, null);
      const sentMsg = await channel.send({ embeds: [embed] }).catch(() => null);

      if (sentMsg) {
        const midField = getMidField(val);
        if (midField) {
          data[midField] = sentMsg.id;
        }
      }
    }

    await data.save();
  }
};