const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const TicketSetup = require('../database/TicketSetup');

module.exports = (client) => {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // Step 1: Delete button pressed
    if (interaction.customId.startsWith('ticket_delete_')) {
      await interaction.deferReply({ ephemeral: true });

      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_delete_${interaction.user.id}`)
          .setLabel('Yes, Delete Ticket')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`cancel_delete_${interaction.user.id}`)
          .setLabel('No, Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.editReply({
        content: 'Are you sure you want to delete this ticket?',
        components: [confirmRow],
      });
    }

    // Step 2: Confirm Delete
    if (interaction.customId.startsWith('confirm_delete_')) {
      const userId = interaction.customId.split('_')[2];
      if (interaction.user.id !== userId)
        return interaction.reply({ content: 'You are not allowed to use this button.', ephemeral: true });

      const data = await TicketSetup.findOne({ guildId: interaction.guildId });
      if (!data) return interaction.reply({ content: 'Ticket system not found.', ephemeral: true });

      let panelIndex = -1;
      let ticketIndex = -1;
      for (let i = 0; i < data.panels.length; i++) {
        ticketIndex = data.panels[i].tickets.findIndex(t => t.channelId === interaction.channel.id);
        if (ticketIndex !== -1) {
          panelIndex = i;
          break;
        }
      }

      if (panelIndex === -1 || ticketIndex === -1)
        return interaction.reply({ content: 'Ticket not found in database.', ephemeral: true });

      const ticket = data.panels[panelIndex].tickets[ticketIndex];

      try {
        const ticketUser = await interaction.guild.members.fetch(ticket.userId).catch(() => null);
        const panel = data.panels[panelIndex];

        // Remove ticket from DB
        data.panels[panelIndex].tickets.splice(ticketIndex, 1);
        await data.save();

        // Send log before deletion
        if (panel.logsChannel) {
          const logChannel = interaction.guild.channels.cache.get(panel.logsChannel);
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setTitle('TICKET DELETED')
              .addFields(
                { name: 'Panel', value: panel.panelName || 'Unknown', inline: true },
                { name: 'Deleted By', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Ticket Creator', value: ticketUser ? `<@${ticket.userId}>` : ticket.userId, inline: true }
              )
              .setColor('DarkRed')
              .setTimestamp();
            await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
          }
        }

        // Delete channel
        await interaction.channel.delete().catch(() => {});
      } catch (err) {
        console.error(err);
        return interaction.reply({ content: 'Failed to delete the ticket.', ephemeral: true });
      }
    }

    // Step 3: Cancel Delete
    if (interaction.customId.startsWith('cancel_delete_')) {
      const userId = interaction.customId.split('_')[2];
      if (interaction.user.id !== userId)
        return interaction.reply({ content: 'You are not allowed to use this button.', ephemeral: true });

      return interaction.reply({ content: 'Ticket deletion cancelled.', ephemeral: true });
    }
  });
};