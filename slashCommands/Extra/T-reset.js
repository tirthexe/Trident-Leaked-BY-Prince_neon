const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const TicketSetup = require('../../database/TicketSetup');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel-reset')
    .setDescription('Reset all ticket panels with confirmation (Admin only)'),

  async execute(client, interaction) {
    // Admin check
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('Only administrators can use this command.')
        ],
        ephemeral: true
      });
    }

    const ticketData = await TicketSetup.findOne({ guildId: interaction.guild.id });
    if (!ticketData || !ticketData.panels.length) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('There are no panels to reset.')
        ],
        ephemeral: true
      });
    }

    const confirmEmbed = new EmbedBuilder()
      .setTitle('Confirm Panel Reset')
      .setColor('Orange')
      .setDescription('Are you sure you want to **reset all ticket panels**?\n\n**Warning:** Once reset, you **cannot recover** them.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('panel_reset_yes')
        .setLabel('Yes')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('panel_reset_no')
        .setLabel('No')
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      fetchReply: true
    });

    const filter = i => i.user.id === interaction.user.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.customId === 'panel_reset_yes') {
        await TicketSetup.findOneAndDelete({ guildId: interaction.guild.id });

        await buttonInteraction.update({
          embeds: [
            new EmbedBuilder()
              .setColor('Green')
              .setDescription('All ticket panels have been successfully **reset**.')
          ],
          components: []
        });

      } else if (buttonInteraction.customId === 'panel_reset_no') {
        await buttonInteraction.update({
          embeds: [
            new EmbedBuilder()
              .setColor('Grey')
              .setDescription('Panel reset has been **cancelled**.')
          ],
          components: []
        });
      }
    });

    collector.on('end', collected => {
      if (!collected.size) {
        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setDescription('You took too long to respond. The panel reset has been cancelled.')
          ],
          components: []
        });
      }
    });
  }
};