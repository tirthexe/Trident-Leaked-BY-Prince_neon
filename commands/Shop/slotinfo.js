const { PermissionsBitField } = require('discord.js');
const SlotSetup = require('../../database/SlotSetup');
const { createEmbed } = require('../../embed');
const emoji = require('../../emoji');

module.exports = {
  name: 'slotinfo',
  aliases: ["sinfo","sloti"],
  description: 'Displays server slot information',
  async execute(client, message, args) {
    const executor = message.author;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | You must be an admin to use this command.`, executor, client, null)],
      });
    }

    let slotData = await SlotSetup.findOne({ guildId: message.guild.id });

    if (!slotData || (!slotData.categories.length && !slotData.slotRole)) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | No slot setup found for this server.`, executor, client, null)],
      });
    }

    // Fetch category names
    const categories = slotData.categories.map(id => {
      const category = message.guild.channels.cache.get(id);
      return category ? category.name : `\`${id}\``;
    });

    const slotRole = slotData.slotRole ? `<@&${slotData.slotRole}>` : '`None`';
    const totalSlots = slotData.slots.length;

    return message.reply({
      embeds: [
        createEmbed(
          '#00FFFF',
          `**__Slot Information__**\n\n` +
            `> **Slot Categories:** ${categories.length ? categories.join(', ') : '`None`'}\n` +
            `> **Slot Role:** ${slotRole}\n` +
            `> **Total Slots:** \`${totalSlots}\``,
          executor,
          client,
          null
        ),
      ],
    });
  },
};