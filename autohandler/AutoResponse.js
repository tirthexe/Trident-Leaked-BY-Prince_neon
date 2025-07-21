const AutoResponse = require('../database/AutoResponse');
const Blacklist = require('../db/Blacklist');
const Bypass = require('../db/bypass');

const usageCounter = new Map();
const blacklistCooldown = new Map();

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (!message || message.author.bot || !message.guild) return;

    const userId = message.author.id;

    const isBypassed = await Bypass.findOne({ userId });

    // Check for valid auto response trigger
    const autoData = await AutoResponse.findOne({ guildId: message.guild.id });
    if (!autoData || !autoData.triggers || autoData.triggers.length === 0) return;

    const lowerContent = message.content.toLowerCase();
    const triggerData = autoData.triggers.find(t => t.trigger.toLowerCase() === lowerContent);
    if (!triggerData) return;

    // Blacklist / cooldown logic
    if (!isBypassed) {
      const entry = await Blacklist.findOne({ userId });
      const isBlacklisted = entry && !(entry.bypass === 1 || entry.bypass === true);
      const now = Date.now();

      if (isBlacklisted) {
        const lastReply = blacklistCooldown.get(userId) || 0;
        if (now - lastReply >= 10000) {
          blacklistCooldown.set(userId, now);
          return message.reply("You are globally blacklisted and cannot trigger bot responses.");
        } else return;
      }

      // Spam detection
      const userData = usageCounter.get(userId) || { count: 0, lastUsed: 0 };
      if (now - userData.lastUsed < 10000) {
        userData.count++;
      } else {
        userData.count = 1;
      }
      userData.lastUsed = now;

      if (userData.count === 4) {
        message.reply("You are triggering responses too frequently. Continued spamming may result in a global blacklist.");
      }

      if (userData.count >= 8) {
        await Blacklist.create({ userId, reason: "Auto blacklisted for spamming auto-responses" });
        usageCounter.delete(userId);
        return message.reply("You have been globally blacklisted for spamming auto-responses.");
      }

      usageCounter.set(userId, userData);
    }

    // Send the response
    try {
      const sent = await message.channel.send(triggerData.reply);
      if (triggerData.autodel && !isNaN(triggerData.autodel)) {
        setTimeout(() => {
          sent.delete().catch(() => {});
        }, triggerData.autodel * 1000);
      }
    } catch (err) {
      console.error("Error sending auto-response:", err);
    }
  });
};