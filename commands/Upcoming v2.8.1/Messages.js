const { PermissionsBitField } = require('discord.js');
const MessageCount = require('../../database/messagecount');
const { createEmbed } = require('../../embed');
const emoji = require('../../emoji');

module.exports = {
  name: 'messages',
  aliases: ['m'],
  description: 'Check and manage message counts',
  async execute(client, message, args) {
    const executor = message.author;
    const member = message.member;

    const hasPermission = member.permissions.has(PermissionsBitField.Flags.Administrator) ||
      member.roles.cache.some(role => role.name === 'TRIDENT ADMIN');

    const guildData = await MessageCount.findOne({ guildId: message.guild.id });
    if (!guildData || !guildData.enable) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | Message Count system is disabled or not set up in this server.`, executor, client, null)],
      });
    }

    const subcommand = args[0]?.toLowerCase();

    // HELP
    if (subcommand === 'help') {
      const helpEmbed = createEmbed(
        '#00FFFF',
        `**${emoji.settings} Message Commands Help**\n\n` +
        `${emoji.dot} \`m [@user|id]\` — Show message count\n` +
        `${emoji.dot} \`m add [@user|id] [amount]\` — Add messages to allTime\n` +
        `${emoji.dot} \`m remove [@user|id] [amount]\` — Remove messages from allTime, week, yesterday, today, month\n` +
        `${emoji.dot} \`m reset [@user|id|all]\` — Reset messages for a user or all\n` +
        `${emoji.lock} \`add/remove/reset\` require Admin or TRIDENT ADMIN role.`,
        executor,
        client,
        null
      );
      return message.reply({ embeds: [helpEmbed] });
    }

    // ADD
    if (subcommand === 'add') {
      if (!hasPermission)
        return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | You don't have permission to use this command.`, executor, client, null)] });

      const user = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
      const amount = parseInt(args[2]);

      if (!user || isNaN(amount) || amount <= 0) {
        return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | Usage: \`m add [@user|id] [amount]\``, executor, client, null)] });
      }

      let userData = guildData.users.find(u => u.userId === user.id);
      if (!userData) {
        userData = { userId: user.id, allTime: 0, month: 0, week: 0, yesterday: 0, today: 0 };
        guildData.users.push(userData);
      }

      userData.allTime += amount;
      userData.month += amount; // also add to month
      await guildData.save();

      return message.reply({
        embeds: [createEmbed('#00FF00', `${emoji.success} | Added ${amount} messages to ${user}. Total: ${userData.allTime}`, executor, client, null)],
      });
    }

    // REMOVE
    if (subcommand === 'remove') {
      if (!hasPermission)
        return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | You don't have permission to use this command.`, executor, client, null)] });

      const user = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
      let amount = parseInt(args[2]);

      if (!user || isNaN(amount) || amount <= 0) {
        return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | Usage: \`m remove [@user|id] [amount]\``, executor, client, null)] });
      }

      const userData = guildData.users.find(u => u.userId === user.id);
      if (!userData) {
        return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | No message data found for this user.`, executor, client, null)] });
      }

      let toRemove = amount;
      const removeFromField = (field) => {
        const available = userData[field] ?? 0;
        const deduction = Math.min(toRemove, available);
        userData[field] = available - deduction;
        toRemove -= deduction;
      };

      removeFromField('today');
      removeFromField('yesterday');
      removeFromField('week');
      removeFromField('month'); // remove from month too
      removeFromField('allTime');

      if (toRemove === amount) {
        return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | This user doesn't have enough messages to remove.`, executor, client, null)] });
      }

      await guildData.save();

      const removed = amount - toRemove;
      return message.reply({
        embeds: [createEmbed('#00FF00', `${emoji.success} | Removed ${removed} messages from ${user}.`, executor, client, null)],
      });
    }

    // RESET
    if (subcommand === 'reset') {
      if (!hasPermission)
        return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | You don't have permission to use this command.`, executor, client, null)] });

      const target = args[1];

      if (!target) {
        return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | Usage: \`m reset [@user|id|all]\``, executor, client, null)] });
      }

      if (target.toLowerCase() === 'all') {
        guildData.users = [];
        await guildData.save();

        return message.reply({ embeds: [createEmbed('#FFA500', `${emoji.success} | All message data has been reset.`, executor, client, null)] });
      }

      const user = message.mentions.members.first() || message.guild.members.cache.get(target);
      if (!user) {
        return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | Invalid user.`, executor, client, null)] });
      }

      const index = guildData.users.findIndex(u => u.userId === user.id);
      if (index === -1) {
        return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | No message data found for this user.`, executor, client, null)] });
      }

      guildData.users.splice(index, 1);
      await guildData.save();

      return message.reply({ embeds: [createEmbed('#FFA500', `${emoji.success} | Message data reset for ${user}.`, executor, client, null)] });
    }

    // DEFAULT — View messages
    const mention = message.mentions.members.first();
    const target = mention || message.guild.members.cache.get(args[0]) || message.member;
    const userData = guildData.users.find(u => u.userId === target.id);

    const formatCount = (n) => n ?? 0;

    const allTime = formatCount(userData?.allTime);
    const month = formatCount(userData?.month); // New
    const week = formatCount(userData?.week);
    const yesterday = formatCount(userData?.yesterday);
    const today = formatCount(userData?.today);
    const average = Math.floor(week / 7);

    const embed = createEmbed(
      '#00FFFF',
      `**Messages Count for ${target}**\n\n` +
      `> ${emoji.dot} **All time:** ${allTime} Messages\n` +
      `> ${emoji.dot} **This month:** ${month} Messages\n` + // New
      `> ${emoji.dot} **This week:** ${week} Messages\n\n` +
      ` ${emoji.category} ** __ EXTRA __ ** \n\n` + 
      `> ${emoji.dot} **Yesterday:** ${yesterday} Messages\n` +
      `> ${emoji.dot} **Today:** ${today} Messages\n\n` +
      `${emoji.arrow} **AVERAGE:** ${average} messages/day (weekly)`,
      executor,
      client,
      null
    );

    return message.reply({ embeds: [embed] });
  }
};