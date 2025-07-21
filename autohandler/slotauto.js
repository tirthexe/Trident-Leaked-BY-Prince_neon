const { createEmbed } = require('../embed');
const emoji = require('../emoji');
const SlotSetup = require('../database/SlotSetup');
const PingCount = require('../database/PingCount');
const { PermissionsBitField } = require('discord.js');

module.exports = async (client) => {
  client.on('messageCreate', async (message) => {
    if (!message || message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const channelId = message.channel.id;

    // ✅ Check if message contains @here or @everyone
    const hasHere = message.content.includes("@here");
    const hasEveryone = message.content.includes("@everyone");

    if (!hasHere && !hasEveryone) return;

    // Fetch slot data from MongoDB
    const guildSlotData = await SlotSetup.findOne({ guildId });
    if (!guildSlotData) return;

    // Find the user's slot
    const slot = guildSlotData.slots.find((s) => s.userId === userId && s.channelId === channelId);
    if (!slot) return;

    // ✅ Extract total pings allowed per day
    const pingType = slot.pingCount.toLowerCase().includes("here") ? "@here" : "@everyone";
    const totalPings = parseInt(slot.pingCount.match(/\d+/)?.[0]) || 30; // Default to 30

    // ✅ Fetch or create user's ping count entry
    let userPingData = await PingCount.findOne({ guildId, userId, channelId });

    if (!userPingData) {
      userPingData = new PingCount({ guildId, userId, channelId, usedPings: 0, lastReset: new Date() });
    }

    // ✅ Get current IST time
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const resetTime = new Date(userPingData.lastReset);
    resetTime.setHours(0, 1, 0, 0); // Set reset time to 12:01 AM IST

    // ✅ Reset pings if it's a new day
    if (nowIST >= resetTime) {
      userPingData.usedPings = 0;
      userPingData.lastReset = nowIST;
      await userPingData.save();

      // ✅ Restore mention permission only for the slot user
      const channel = message.guild.channels.cache.get(channelId);
      if (channel) {
        await channel.permissionOverwrites.edit(userId, {
          [PermissionsBitField.Flags.MentionEveryone]: true, // ✅ Restore only for the user
        });
      }
    }

    // ✅ Increase usedPings count
    userPingData.usedPings += 1;
    await userPingData.save();

    // ✅ Check if user reached the daily ping limit
    if (userPingData.usedPings >= totalPings) {
      // Remove mention permission only for the user
      const channel = message.guild.channels.cache.get(channelId);
      if (channel) {
        await channel.permissionOverwrites.edit(userId, {
          [PermissionsBitField.Flags.MentionEveryone]: false, // ❌ Remove only for the user
        });
      }

      // ✅ Inform the user & reset the ping count
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.anvi} | **You have used all your ${totalPings}/${totalPings} pings for today!**\nYou can no longer mention @here until 12:01 AM IST.`,
            message.author,
            client,
            null
          ),
        ],
      });
    }

    // ✅ Send ping usage update
    message.reply({
      embeds: [
        createEmbed(
          "#00FF00",
          `${emoji.anvi} | **You have used ${userPingData.usedPings}/${totalPings} pings today!**\nYour pings will reset at 12:01 AM IST.`,
          message.author,
          client,
          null
        ),
      ],
    });
  });

  // ✅ Automatically reset all slot users' pings at 12:01 AM IST
  setInterval(async () => {
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    if (nowIST.getHours() === 0 && nowIST.getMinutes() === 1) { // 12:01 AM IST
      const allSlots = await PingCount.find({});
      for (let userPingData of allSlots) {
        userPingData.usedPings = 0;
        userPingData.lastReset = nowIST;
        await userPingData.save();

        // ✅ Restore mention permission only for the user
        const guild = client.guilds.cache.get(userPingData.guildId);
        if (guild) {
          const channel = guild.channels.cache.get(userPingData.channelId);
          if (channel) {
            await channel.permissionOverwrites.edit(userPingData.userId, {
              [PermissionsBitField.Flags.MentionEveryone]: true, // ✅ Give permission back only to the user
            });
          }
        }
      }
      console.log("✅ All slot users' pings reset & permissions restored at 12:01 AM IST.");
    }
  }, 60 * 1000); // ✅ Runs every 1 minute to check for reset time
};