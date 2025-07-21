const { createEmbed } = require('../../embed');
const SlotSetup = require('../../database/SlotSetup');
const SlotPings = require('../../database/PingCount'); // New ping tracking DB
const emoji = require('../../emoji');
const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'slotuser',
  aliases: ["su","suser"],
  description: 'Check a user\'s slot details',
  async execute(client, message, args) {
    // Check if the user has Administrator permission
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply(`${emoji.cross} | You need **Administrator** permission to use this command.`);
    }

    const user = message.mentions.users.first() || client.users.cache.get(args[0]);
    if (!user) {
      return message.reply(`${emoji.cross} | Please mention a valid user.`);
    }

    const guildId = message.guild.id;
    const slotData = await SlotSetup.findOne({ guildId });
    if (!slotData || !slotData.slots.length) {
      return message.reply(`${emoji.cross} | No slot data found for this server.`);
    }

    const userSlot = slotData.slots.find(slot => slot.userId === user.id);
    if (!userSlot) {
      return message.reply(`${emoji.cross} | This user does not have an active slot.`);
    }

    const pingData = await SlotPings.findOne({ userId: user.id, guildId }) || { usedPings: 0 };

    const activatedAt = `<t:${Math.floor(userSlot.activatedAt / 1000)}:F>`;
    const expiredAt = `<t:${Math.floor(userSlot.expiration / 1000)}:F>`;
    const remainingDuration = Math.max(0, Math.floor((userSlot.expiration - Date.now()) / 86400000)); // In days

    const embed = createEmbed(
      '#00FFFF',
      `**Slot Information for ${user.username}**\n\n` +
      `**📅 Activated At:** ${activatedAt}\n` +
      `**⏳ Expires At:** ${expiredAt}\n` +
      `**🕒 Remaining Days:** ${remainingDuration} days\n` +
      `**📢 Total Pings:** ${userSlot.pingCount}\n` +
      `**🚨 Used Pings:** ${pingData.usedPings || 0}/${userSlot.pingCount}`,
      message.author,
      client,
      null
    );

    return message.reply({ embeds: [embed] });
  }
};