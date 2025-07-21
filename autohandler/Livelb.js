const {
  ChannelType,
  EmbedBuilder
} = require('discord.js');
const LiveLeaderboard = require('../database/liveleaderboard');
const MessageCount = require('../database/messagecount');
const VoiceCount = require('../database/voicecount');
const emoji = require('../emoji');

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

function buildLeaderboard(users, isMessage) {
  return users.map((u, i) => {
    const value = isMessage ? u.value : formatSecondsToHMS(u.value);
    let icon;
    if (i === 0) icon = emoji.lb1;
    else if (i === 1) icon = emoji.lb2;
    else if (i === 2) icon = emoji.lb3;
    else icon = emoji.dot;
    return `${icon} | <@${u.userId}> = ${value}`;
  }).join('\n');
}

async function updateLeaderboard(client) {
  const dataList = await LiveLeaderboard.find({});
  for (const data of dataList) {
    const guild = await client.guilds.fetch(data.guildId).catch(() => null);
    if (!guild) continue;

    const updateTypes = [
      { field: 'messagesDaily', mid: 'messagesDailyMid', isMsg: true, time: 'daily' },
      { field: 'messagesWeekly', mid: 'messagesWeeklyMid', isMsg: true, time: 'weekly' },
      { field: 'messagesMonthly', mid: 'messagesMonthlyMid', isMsg: true, time: 'monthly' },
      { field: 'messagesAll', mid: 'messagesAllMid', isMsg: true, time: 'all' },
      { field: 'voiceDaily', mid: 'voiceDailyMid', isMsg: false, time: 'daily' },
      { field: 'voiceWeekly', mid: 'voiceWeeklyMid', isMsg: false, time: 'weekly' },
      { field: 'voiceMonthly', mid: 'voiceMonthlyMid', isMsg: false, time: 'monthly' },
      { field: 'voiceAll', mid: 'voiceAllMid', isMsg: false, time: 'all' }
    ];

    for (const type of updateTypes) {
      const channelId = data[type.field];
      const messageId = data[type.mid];
      if (!channelId || !messageId) continue;

      const channel = guild.channels.cache.get(channelId);
      if (!channel || channel.type !== ChannelType.GuildText) continue;

      const model = type.isMsg ? MessageCount : VoiceCount;
      const db = await model.findOne({ guildId: data.guildId }).catch(() => null);
      if (!db) continue;

      const key = getTimeKey(type.time);
      const leaderboard = db.users
        .filter(u =>
          !db.blacklist?.users?.includes(u.userId) &&
          !db.blacklist?.channels?.includes(channelId)
        )
        .map(u => ({ userId: u.userId, value: u[key] || 0 }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);

      if (!leaderboard.length) continue;

      const description = buildLeaderboard(leaderboard, type.isMsg);
      const embed = new EmbedBuilder()
        .setColor(type.isMsg ? 0x3498DB : 0x2ECC71)
        .setTitle(`${type.time.toUpperCase()} ${type.isMsg ? 'MESSAGE' : 'VOICE'} LIVE LEADERBOARD`)
        .setDescription(description)
        .setTimestamp();

      try {
        const msg = await channel.messages.fetch(messageId).catch(() => null);
        if (!msg) continue;
        await msg.edit({ embeds: [embed] }).catch(() => null);
      } catch (e) {
        continue; // silently skip any errors
      }
    }
  }
}

module.exports = (client) => {
  setInterval(() => updateLeaderboard(client), 45_000);
};