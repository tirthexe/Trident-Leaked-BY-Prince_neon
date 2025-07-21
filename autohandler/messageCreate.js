const RoleSetup = require('../database/RoleSetup');
const PrefixModel = require('../database/prefix');
const Blacklist = require('../db/Blacklist');
const Bypass = require('../db/bypass');
const path = require('path');
const fs = require('fs');
const { createEmbed } = require('../embed');
const emoji = require('../emoji');

const noPrefixFilePath = path.join(__dirname, '../noPrefixUsers.json');
const noPrefixData = JSON.parse(fs.readFileSync(noPrefixFilePath, 'utf-8'));
const noPrefixUsers = noPrefixData.noPrefixUsers;

const usageCounter = new Map();
const blacklistCooldown = new Map();

async function getGuildPrefix(guildId) {
  try {
    const data = await PrefixModel.findOne({ guildId });
    return data?.prefix || null;
  } catch (err) {
    console.error("Error fetching prefix from database:", err);
    return null;
  }
}

// ...[same requires and setup as before]

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (!message || message.author.bot || !message.guild) return;

    const executor = message.author;
    const userId = executor.id;

    const isBypassed = await Bypass.findOne({ userId });
    const isNoPrefixUser = noPrefixUsers.includes(userId);
    const guildPrefix = await getGuildPrefix(message.guild.id);

    const mentionPrefixes = [`<@${client.user.id}>`, `<@!${client.user.id}>`];
    const activePrefixes = guildPrefix ? [guildPrefix, ...mentionPrefixes] : ['$', ...mentionPrefixes];

    const usedPrefix = activePrefixes.find((prefix) => message.content.startsWith(prefix));
    let args, keyword;

    if (isNoPrefixUser) {
      args = usedPrefix ? message.content.slice(usedPrefix.length).trim().split(/ +/) : message.content.trim().split(/ +/);
      keyword = args.shift()?.toLowerCase();
    } else {
      if (!usedPrefix) return;
      args = message.content.slice(usedPrefix.length).trim().split(/ +/);
      keyword = args.shift()?.toLowerCase();
    }

    // First check if the keyword matches a valid setup name
    const setup = await RoleSetup.findOne({ guildId: message.guild.id, name: keyword });
    if (!setup) return; // Stop everything if keyword is not a setup name

    // Now continue with blacklist/spam logic since it's a valid setup name
    if (!isBypassed) {
      const entry = await Blacklist.findOne({ userId });
      const isBlacklisted = entry && !(entry.bypass === 1 || entry.bypass === true);
      const now = Date.now();

      if (isBlacklisted) {
        const lastReply = blacklistCooldown.get(userId) || 0;
        if (now - lastReply >= 10000) {
          blacklistCooldown.set(userId, now);
          return message.reply("You are globally blacklisted and cannot use bot commands.");
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
        message.reply("You are using commands too frequently. Continued spamming may result in a global blacklist.");
      }

      if (userData.count >= 8) {
        await Blacklist.create({ userId, reason: "Auto blacklisted for spamming commands" });
        usageCounter.delete(userId);
        return message.reply("You have been globally blacklisted for spamming commands.");
      }

      usageCounter.set(userId, userData);
    }

    // Role toggle logic continues...
    const user = message.mentions.members.first();
    const managerRoleData = await RoleSetup.findOne({ guildId: message.guild.id, name: 'managerRole' });
    const managerRoleId = managerRoleData?.managerRoleId;
    const managerRole = managerRoleId ? message.guild.roles.cache.get(managerRoleId) : null;

    if (!managerRole) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | Manager role is not set or invalid. Please check the setup.`, executor, client, null)],
      });
    }

    if (!message.member.roles.cache.has(managerRole.id)) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | You do not have the required manager role: ${managerRole}.`, executor, client, null)],
      });
    }

    if (!user) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | Please mention a user to assign or remove the role.`, executor, client, null)],
      });
    }

    const roleToToggle = message.guild.roles.cache.get(setup.roleId);
    if (!roleToToggle) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | The role no longer exists.`, executor, client, null)],
      });
    }

    try {
      if (user.roles.cache.has(roleToToggle.id)) {
        await user.roles.remove(roleToToggle, `Removed by ${executor.tag}`);
        return message.reply({
          embeds: [createEmbed('#00FF00', `${emoji.tick} | Removed role ${roleToToggle} from ${user}.`, executor, client, null)],
        });
      } else {
        await user.roles.add(roleToToggle, `Assigned by ${executor.tag}`);
        return message.reply({
          embeds: [createEmbed('#00FF00', `${emoji.tick} | Added role ${roleToToggle} to ${user}.`, executor, client, null)],
        });
      }
    } catch (error) {
      console.error('Error toggling role:', error);
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | Error toggling the role. Check permissions.`, executor, client, null)],
      });
    }
  });
};