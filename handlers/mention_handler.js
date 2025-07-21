const {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle
} = require("discord.js");
const emoji = require("../emoji");

const Blacklist = require("../db/Blacklist");
const Bypass = require("../db/bypass");
const PrefixDB = require("../database/prefix");

const usageCounter = new Map();
const blacklistCooldown = new Map(); // NEW

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    const mentionOnly = new RegExp(`^<@!?${client.user.id}>$`);
    const isMention = mentionOnly.test(message.content.trim());
    if (!isMention) return;

    const userId = message.author.id;
    const now = Date.now();

    // --- Bypass Check ---
    const isBypassed = await Bypass.findOne({ userId });

    // --- Blacklist Check ---
    if (!isBypassed) {
      const blacklistEntry = await Blacklist.findOne({ userId });
      const isBlacklisted = blacklistEntry && !(blacklistEntry.bypass === 1 || blacklistEntry.bypass === true);

      if (isBlacklisted) {
        const lastReply = blacklistCooldown.get(userId) || 0;
        if (now - lastReply >= 10000) {
          blacklistCooldown.set(userId, now);
          return message.reply("You are blacklisted globally and cannot interact with the bot.");
        } else {
          return; // Skip reply if within cooldown
        }
      }
    }

    // --- Spam Detection ---
    if (!isBypassed) {
      if (!usageCounter.has(userId)) {
        usageCounter.set(userId, { count: 1, lastUsed: now });
      } else {
        const userData = usageCounter.get(userId);
        if (now - userData.lastUsed < 10000) {
          userData.count++;
        } else {
          userData.count = 1;
        }

        userData.lastUsed = now;

        if (userData.count >= 6) {
          await Blacklist.create({
            userId,
            reason: "Auto blacklisted for mention spamming"
          });
          usageCounter.delete(userId);
          return message.reply("You have been globally blacklisted for spamming bot mentions.");
        }

        usageCounter.set(userId, userData);
      }
    }

    // --- Send Bot Response Embed ---
    return sendBotMentionReply(message, client);
  });

  console.log("Mention handler with bypass, blacklist cooldown, and spam protection loaded!");
};

// --- Send Reply Embed Function ---
async function sendBotMentionReply(message, client) {
  let prefix = "$";
  const guildPrefix = await PrefixDB.findOne({ guildId: message.guild.id });
  if (guildPrefix?.prefix) prefix = guildPrefix.prefix;

  const embed = new EmbedBuilder()
    .setColor("#ff0000")
    .setThumbnail(client.user.displayAvatarURL())
    .setAuthor({
      name: message.author.username,
      iconURL: message.author.displayAvatarURL()
    })
    .setDescription(
      `Hey ${message.author}, I am **${client.user.username}**, a best **security and management** bot...!!\n\n` +
      `> ${emoji.dot} **Prefix:** \`${prefix}\`\n` +
      `> ${emoji.dot} **For Help:** Type \`${prefix}help\`\n` +
      `> ${emoji.dot} **For Bot Info:** Type \`${prefix}botinfo\``
    )
    .setFooter({
      text: "TRIDENT DEVELOPMENT",
      iconURL: message.guild.iconURL() || client.user.displayAvatarURL()
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Invite Me")
      .setURL("https://discord.com/oauth2/authorize?client_id=1327936936203124789&permissions=8&integration_type=0&scope=bot")
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setLabel("Support Server")
      .setURL("https://discord.gg/lovers-arenaa")
      .setStyle(ButtonStyle.Link)
  );

  return message.reply({ embeds: [embed], components: [row] });
}