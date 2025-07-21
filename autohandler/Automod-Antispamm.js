const { Collection, EmbedBuilder } = require('discord.js');
const Automod = require('../database/Automod');
const emojis = require('../emoji');
const ms = require('ms');

const messageLogs = new Collection();
const lastMessages = new Collection();

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot || !message.content) return;

    const automod = await Automod.findOne({ guildId: message.guild.id });
    if (!automod || !automod.enabled) return;

    const userId = message.author.id;
    const member = message.member;
    const channelId = message.channel.id;
    const categoryId = message.channel.parentId;
    const content = message.content;

    // === ANTILINK ===
    if (automod.antilink) {
      const wl = automod.whitelist?.antilink || {};
      const bypass =
        wl.users?.includes(userId) ||
        wl.channels?.includes(channelId) ||
        wl.categories?.includes(categoryId) ||
        member.roles.cache.some(r => wl.roles?.includes(r.id));

      if (!bypass) {
        const linkRegex = /https?:\/\/[^\s]+/gi;
        if (linkRegex.test(content)) {
          return punish(message, automod, content, 'ANTILINK ALERT');
        }
      }
    }

    // === ANTIADVERTISE ===
    if (automod.antiad) {
      const wl = automod.whitelist?.antiad || {};
      const bypass =
        wl.users?.includes(userId) ||
        wl.channels?.includes(channelId) ||
        wl.categories?.includes(categoryId) ||
        member.roles.cache.some(r => wl.roles?.includes(r.id));

      if (!bypass) {
        const adRegexes = [
          /discord\.gg\//gi,
          /discord\.com\/invite\//gi,
          /youtube\.com/gi,
          /youtu\.be/gi,
          /instagram\.com/gi,
          /pornhub\.com/gi,
          /onlyfans\.com/gi,
          /xvideos\.com/gi,
          /xnxx\.com/gi
        ];
        if (adRegexes.some(rx => rx.test(content))) {
          return punish(message, automod, content, 'ANTIADVERTISE ALERT');
        }
      }
    }

    // === ANTISPAM ===
    if (automod.antispam) {
      const wl = automod.whitelist?.antispam || {};
      const bypass =
        wl.users?.includes(userId) ||
        wl.channels?.includes(channelId) ||
        wl.categories?.includes(categoryId) ||
        member.roles.cache.some(r => wl.roles?.includes(r.id));

      if (!bypass) {
        // Message flood
        if (!messageLogs.has(userId)) messageLogs.set(userId, []);
        messageLogs.get(userId).push(Date.now());
        const filtered = messageLogs.get(userId).filter(ts => Date.now() - ts < 15000);
        messageLogs.set(userId, filtered);
        if (filtered.length >= 7) return punish(message, automod, content, 'ANTISPAMM ALERT');

        // Emoji spam
        const emojiRegex = /<a?:\w+:\d+>|[\u{1F600}-\u{1F64F}]/gu;
        const emojisUsed = content.match(emojiRegex) || [];
        const emojiPercentage = (emojisUsed.length / content.length) * 100;
        if (emojisUsed.length > 9 || emojiPercentage > 60) return punish(message, automod, content, 'ANTISPAMM ALERT');

        // Caps spam
        const letters = content.replace(/[^a-zA-Z]/g, '');
        const caps = letters.replace(/[^A-Z]/g, '');
        const capsPercentage = (caps.length / letters.length) * 100;
        if (letters.length > 5 && capsPercentage > 70) return punish(message, automod, content, 'ANTISPAMM ALERT');

        // Newlines
        const newlines = content.split('\n').length - 1;
        if (newlines >= 10) return punish(message, automod, content, 'ANTISPAMM ALERT');

        // Repeated messages
        if (!lastMessages.has(userId)) lastMessages.set(userId, []);
        const prev = lastMessages.get(userId);
        prev.push(content);
        if (prev.length > 5) prev.shift();
        lastMessages.set(userId, prev);
        const repeat = prev.filter(msg => msg === content).length;
        if (repeat >= 4) return punish(message, automod, content, 'ANTISPAMM ALERT');
      }
    }

    // === ANTIMENTION ===
    if (automod.antimention) {
      const wl = automod.whitelist?.antimention || {};
      const bypass =
        wl.users?.includes(userId) ||
        wl.channels?.includes(channelId) ||
        wl.categories?.includes(categoryId) ||
        member.roles.cache.some(r => wl.roles?.includes(r.id));

      if (!bypass) {
        const userMentions = message.mentions.users.size;
        const roleMentions = message.mentions.roles.size;

        if (userMentions > 5 || roleMentions > 5) {
          return punish(message, automod, content, 'ANTIMENTION ALERT');
        }
      }
    }
  });
};

async function punish(message, automod, violatedMessage, title) {
  const member = message.member;
  const punishment = automod.punishment || 'mute';
  let success = true;

  // Delete the original message that triggered the automod
  await message.delete().catch(() => {});

  let reason = '';
  try {
    switch (punishment) {
      case 'mute': {
        const duration = ms(automod.muteDuration || '2m');
        await member.timeout(duration, 'AutoMod Violation');
        reason = `was muted for ${ms(duration, { long: true })}`;
        break;
      }
      case 'warn': {
        reason = 'was warned for rule violation';
        break;
      }
      case 'kick': {
        await member.kick('AutoMod Violation');
        reason = 'was kicked for rule violation';
        break;
      }
      case 'ban': {
        await member.ban({ reason: 'AutoMod Violation' });
        reason = 'was banned for rule violation';
        break;
      }
    }

    if (reason) {
      const msg = await message.channel.send(`**${member} ${reason}.**`);
      setTimeout(() => msg.delete().catch(() => {}), 5000);
    }
  } catch (err) {
    success = false;
    console.error('[AutoMod Error]:', err);
    const failMsg = await message.channel.send(`**Failed to punish ${member.user.tag} due to missing permissions.**`);
    setTimeout(() => failMsg.delete().catch(() => {}), 5000);
  }

  // Logging
  if (automod.logChannel) {
    const logChannel = message.guild.channels.cache.get(automod.logChannel);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle(title)
        .addFields(
          { name: '__USER__', value: `${member} (\`${member.id}\`)`, inline: false },
          { name: '__CHANNEL__', value: `<#${message.channel.id}>`, inline: false },
          { name: '__MESSAGE__', value: `\`\`\`${violatedMessage.slice(0, 900)}\`\`\``, inline: false },
          { name: '__PUNISHMENT__', value: success ? `${emojis.tick} YES` : `${emojis.cross} NO`, inline: false }
        )
        .setTimestamp();

      logChannel.send({ embeds: [embed] }).catch(() => {});
    }
  }
}