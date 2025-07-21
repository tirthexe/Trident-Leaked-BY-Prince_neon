const MessageCount = require('../database/messagecount');
const moment = require('moment-timezone');
const cron = require('node-cron');

const userMessageTimestamps = new Map();

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    const { guild, channel, author, content } = message;
    const guildId = guild.id;
    const userId = author.id;

    const config = await MessageCount.findOne({ guildId });
    if (!config || !config.enable) return;

    const isBlacklisted =
      config.blacklist.channels.includes(channel.id) ||
      config.blacklist.categories.includes(channel.parentId) ||
      config.blacklist.users.includes(userId);

    if (isBlacklisted) return;

    const isMedia =
      message.attachments.size > 0 ||
      (message.embeds.length > 0 && message.embeds.some(e => e.image || e.video));
    if (!isMedia && (!content || content.trim().length < 2)) return;

    const now = Date.now();
    const timestamps = userMessageTimestamps.get(userId) || [];

    const last5s = timestamps.filter(ts => now - ts < 5000);
    const last10s = timestamps.filter(ts => now - ts < 10000);
    if (last5s.length >= 4 || last10s.length >= 8) return;

    timestamps.push(now);
    userMessageTimestamps.set(userId, timestamps);

    let userData = config.users.find(u => u.userId === userId);
    if (!userData) {
      userData = { userId, allTime: 0, today: 0, yesterday: 0, week: 0, month: 0 };
      config.users.push(userData);
    }

    userData.allTime += 1;
    userData.today += 1;
    userData.week += 1;
    userData.month += 1;

    await config.save();
  });

  cron.schedule('0 0 * * *', async () => {
    const nowIST = moment().tz("Asia/Kolkata");
    const allGuilds = await MessageCount.find({});
    for (const doc of allGuilds) {
      doc.users.forEach(user => {
        user.yesterday = user.today;
        user.today = 0;
      });
      await doc.save();
    }
    console.log(`[${nowIST.format("YYYY-MM-DD")}] ✅ Daily reset complete.`);
  }, { timezone: "Asia/Kolkata" });

  cron.schedule('0 0 * * 0', async () => {
    const nowIST = moment().tz("Asia/Kolkata");
    const allGuilds = await MessageCount.find({});
    for (const doc of allGuilds) {
      doc.users.forEach(user => {
        user.week = 0;
      });
      await doc.save();
    }
    console.log(`[${nowIST.format("YYYY-MM-DD")}] ✅ Weekly reset complete.`);
  }, { timezone: "Asia/Kolkata" });

  cron.schedule('59 23 28-31 * *', async () => {
    const nowIST = moment().tz("Asia/Kolkata");
    const lastDay = nowIST.clone().endOf('month').date();
    if (nowIST.date() !== lastDay) return;

    const allGuilds = await MessageCount.find({});
    for (const doc of allGuilds) {
      doc.users.forEach(user => {
        user.month = 0;
      });
      await doc.save();
    }
    console.log(`[${nowIST.format("YYYY-MM-DD")}] ✅ Message Monthly reset complete.`);
  }, { timezone: "Asia/Kolkata" });
};