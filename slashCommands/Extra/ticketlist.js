const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const TicketSetup = require('../../database/TicketSetup');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketlist')
    .setDescription('Show all ticket panel configurations'),
    
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('Red')
          .setDescription('You need **Administrator** permission to use this command.')],
        ephemeral: true,
      });
    }

    const ticketData = await TicketSetup.findOne({ guildId: interaction.guild.id });
    if (!ticketData || !ticketData.panels.length) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('Red')
          .setDescription('No ticket panels found for this server.')],
        ephemeral: true,
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
          `**Logs Channel:** ${panel.logsChannel ? `<#${panel.logsChannel}>` : 'Not set'}`,
        ].join('\n'),
        inline: false,
      });
    });

    return interaction.reply({ embeds: [embed] });
  }
};