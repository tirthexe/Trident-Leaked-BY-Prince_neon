const { readdirSync } = require("fs");
const path = require("path");
const fs = require("fs");

const noPrefixFilePath = path.join(__dirname, "../noPrefixUsers.json");
const noPrefixData = JSON.parse(fs.readFileSync(noPrefixFilePath, "utf-8"));
const noPrefixUsers = noPrefixData.noPrefixUsers;

const PrefixModel = require("../database/prefix");
const Blacklist = require("../db/Blacklist");
const Bypass = require("../db/bypass"); // NEW bypass import

const cooldowns = new Map();
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

function loadCommands(client) {
  client.commands = new Map();

  const commandFolders = readdirSync(path.join(__dirname, "../commands"));
  for (const folder of commandFolders) {
    const commandFiles = readdirSync(path.join(__dirname, `../commands/${folder}`)).filter(file =>
      file.endsWith(".js")
    );

    for (const file of commandFiles) {
      const command = require(path.join(__dirname, `../commands/${folder}/${file}`));
      if (command.name && command.execute) {
        client.commands.set(command.name, command);
        if (command.aliases) {
          command.aliases.forEach(alias => client.commands.set(alias, command));
        }
        console.log(`Loaded command: ${command.name}`);
      } else {
        console.warn(`Skipping invalid command file: ${file}`);
      }
    }
  }

  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const isNoPrefixUser = noPrefixUsers.includes(userId);
    const guildPrefix = await getGuildPrefix(message.guild.id);
    const mentionPrefixes = [`<@${client.user.id}>`, `<@!${client.user.id}>`];
    const prefixes = guildPrefix ? [guildPrefix, ...mentionPrefixes] : ["$", ...mentionPrefixes];

    const usedPrefix = prefixes.find(prefix => message.content.startsWith(prefix));
    let args, commandName;

    if (isNoPrefixUser) {
      args = usedPrefix
        ? message.content.slice(usedPrefix.length).trim().split(/ +/)
        : message.content.trim().split(/ +/);
      commandName = args.shift()?.toLowerCase();
    } else {
      if (!usedPrefix) return;
      args = message.content.slice(usedPrefix.length).trim().split(/ +/);
      commandName = args.shift()?.toLowerCase();
    }

    const command = client.commands.get(commandName);
    if (!command) return;

    const now = Date.now();

    // --- Check Bypass Status ---
    const isBypassed = await Bypass.findOne({ userId });

    // --- Blacklist Check with Cooldown (Skip if bypassed) ---
    if (!isBypassed) {
      const blacklistEntry = await Blacklist.findOne({ userId });
      const isBlacklisted = blacklistEntry && !(blacklistEntry.bypass === 1 || blacklistEntry.bypass === true);

      if (isBlacklisted) {
        const lastReply = blacklistCooldown.get(userId) || 0;
        if (now - lastReply >= 10000) {
          blacklistCooldown.set(userId, now);
          return message.reply("You are blacklisted globally and cannot use bot commands.");
        } else {
          return;
        }
      }
    }

    // --- Cooldown & Spam Check (Skip if bypassed) ---
    if (!isBypassed) {
      if (!cooldowns.has(userId)) cooldowns.set(userId, {});
      const userCooldown = cooldowns.get(userId);

      const cooldownTime = 4000;
      const lastUsed = userCooldown[commandName] || 0;

      if (now - lastUsed < cooldownTime) {
        if (!userCooldown._cooldownWarned) {
          const timeLeft = ((cooldownTime - (now - lastUsed)) / 1000).toFixed(1);
          message.reply(`You're on cooldown. Please wait ${timeLeft}s.`);
          userCooldown._cooldownWarned = true;
        }
        return;
      }

      userCooldown[commandName] = now;
      userCooldown._cooldownWarned = false;

      // --- Spam Detection ---
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
            reason: "Auto blacklisted for command spamming"
          });
          usageCounter.delete(userId);
          return message.reply("You have been globally blacklisted for spamming commands.");
        }

        usageCounter.set(userId, userData);
      }
    }

    // --- Execute Command ---
    try {
      await command.execute(client, message, args, noPrefixUsers, noPrefixFilePath);
    } catch (error) {
      console.error(`Error executing command "${commandName}":`, error);
      message.channel.send("There was an error while executing this command.");
    }
  });

  console.log("Command handler loaded with bypass + cooldown + blacklist!");
}

module.exports = loadCommands;