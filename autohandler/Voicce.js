const VoiceCount = require('../database/voicecount');
const moment = require('moment-timezone');
const cron = require('node-cron');

const activeVCUsers = new Map();

module.exports = (client) => {
  client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member;
    if (!member || !newState.guild) return;

    const userId = member.id;
    const guildId = newState.guild.id;
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    const config = await VoiceCount.findOne({ guildId });
    if (!config || !config.enable) return;
    if (oldChannel?.type === 13 || newChannel?.type === 13) return;

    if (!oldChannel && newChannel) {
      activeVCUsers.set(userId, { guildId, joinedAt: Date.now() });
    }

    if (oldChannel && !newChannel) {
      const session = activeVCUsers.get(userId);
      if (session) {
        const diff = Math.floor((Date.now() - session.joinedAt) / 1000);
        const leftover = diff % 60;
        if (leftover > 0) {
          const member = await getMemberFromGuild(client, session.guildId, userId);
          if (shouldCount(member, config)) {
            await saveVoiceTime(userId, session.guildId, leftover);
          }
        }
        activeVCUsers.delete(userId);
      }
    }

    if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
      const session = activeVCUsers.get(userId);
      if (session) {
        const diff = Math.floor((Date.now() - session.joinedAt) / 1000);
        const leftover = diff % 60;
        if (leftover > 0) {
          const member = await getMemberFromGuild(client, session.guildId, userId);
          if (shouldCount(member, config)) {
            await saveVoiceTime(userId, session.guildId, leftover);
          }
        }
      }
      activeVCUsers.set(userId, { guildId, joinedAt: Date.now() });
    }
  });

  setInterval(async () => {
    for (const [userId, session] of activeVCUsers.entries()) {
      const member = await getMemberFromGuild(client, session.guildId, userId);
      const config = await VoiceCount.findOne({ guildId: session.guildId });
      if (!member || !member.voice.channel) {
        const diff = Math.floor((Date.now() - session.joinedAt) / 1000);
        const leftover = diff % 60;
        if (leftover > 0 && shouldCount(member, config)) {
          await saveVoiceTime(userId, session.guildId, leftover);
        }
        activeVCUsers.delete(userId);
        continue;
      }

      if (!shouldCount(member, config)) continue;
      await saveVoiceTime(userId, session.guildId, 60);

      session.joinedAt = Date.now();
      activeVCUsers.set(userId, session);
    }
  }, 60 * 1000);

  cron.schedule('0 0 * * *', async () => {
    const nowIST = moment().tz("Asia/Kolkata");
    const allGuilds = await VoiceCount.find({});
    for (const doc of allGuilds) {
      doc.users.forEach(user => {
        user.yesterday = user.today;
        user.today = 0;
      });
      await doc.save();
    }
    console.log(`[${nowIST.format("YYYY-MM-DD")}] ✅ Voice Daily reset complete.`);
  }, { timezone: "Asia/Kolkata" });

  cron.schedule('0 0 * * 0', async () => {
    const nowIST = moment().tz("Asia/Kolkata");
    const allGuilds = await VoiceCount.find({});
    for (const doc of allGuilds) {
      doc.users.forEach(user => {
        user.week = 0;
      });
      await doc.save();
    }
    console.log(`[${nowIST.format("YYYY-MM-DD")}] ✅ Voice Weekly reset complete.`);
  }, { timezone: "Asia/Kolkata" });

  // ✅ Monthly Reset: Last day of month at 11:59 PM IST
  cron.schedule('59 23 28-31 * *', async () => {
    const nowIST = moment().tz("Asia/Kolkata");
    const lastDay = nowIST.clone().endOf('month').date();
    if (nowIST.date() !== lastDay) return;

    const allGuilds = await VoiceCount.find({});
    for (const doc of allGuilds) {
      doc.users.forEach(user => {
        user.month = 0;
      });
      await doc.save();
    }
    console.log(`[${nowIST.format("YYYY-MM-DD")}] ✅ Voice Monthly reset complete.`);
  }, { timezone: "Asia/Kolkata" });
};

async function getMemberFromGuild(client, guildId, userId) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    return member;
  } catch {
    return null;
  }
}

async function saveVoiceTime(userId, guildId, seconds) {
  if (seconds <= 0) return;
  const doc = await VoiceCount.findOne({ guildId });
  if (!doc) return;

  let user = doc.users.find(u => u.userId === userId);
  if (!user) {
    user = { userId, allTime: 0, today: 0, yesterday: 0, week: 0, month: 0 };
    doc.users.push(user);
  }

  user.today += seconds;
  user.week += seconds;
  user.month += seconds;
  user.allTime += seconds;

  await doc.save();
}

function shouldCount(member, config) {
  if (!member || !member.voice.channel || !config) return false;
  if (member.user.bot) return false;

  const channel = member.voice.channel;
  const categoryId = channel.parentId;

  if (config.blacklist?.users?.includes(member.id)) return false;
  if (config.blacklist?.channels?.includes(channel.id)) return false;
  if (config.blacklist?.categories?.includes(categoryId)) return false;

  if (member.voice.selfMute || member.voice.serverMute) return false;
  if (member.voice.selfDeaf || member.voice.serverDeaf) return false;

  const nonBotMembers = channel.members.filter(m => !m.user.bot);
  return nonBotMembers.size >= 2;
}