const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const TicketSetup = require('../../database/TicketSetup');

module.exports = {
  name: 'ticketlist',
  aliases: ['panellist','tl'],
  description: 'Show all ticket panel configurations',
  async execute(client, message) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('Red')
          .setDescription('You need **Administrator** permission to use this command.')],
      });
    }

    const ticketData = await TicketSetup.findOne({ guildId: message.guild.id });
    if (!ticketData || !ticketData.panels.length) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('Red')
          .setDescription('No ticket panels found for this server.')],
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('Ticket Panels')
      .setColor('Blurple');

    ticketData.panels.forEach((panel, index) => {
      embed.addFields({
        name: `[${index + 1}] ${panel.panelName}`,
        value: [
          `**Category:** ${panel.categoryId ? `<#${panel.categoryId}>` : 'Not set'}`,
          `**Channel:** ${panel.ticketChannel ? `<#${panel.ticketChannel}>` : 'Not set'}`,
          `**Staff Role:** ${panel.supportRole ? `<@&${panel.supportRole}>` : 'Not set'}`,
          `**Logs Channel:** ${panel.logsChannel ? `<#${panel.logsChannel}>` : 'Not set'}`, // New logs channel field
        ].join('\n'),
        inline: false,
      });
    });

    return message.reply({ embeds: [embed] });
  }
};