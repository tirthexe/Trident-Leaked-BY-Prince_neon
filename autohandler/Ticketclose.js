const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const TicketSetup = require('../database/TicketSetup');

module.exports = (client) => {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('ticket_close_')) {
      await interaction.deferReply({ ephemeral: true });

      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_close_${interaction.user.id}`)
          .setLabel('Yes, Close Ticket')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`cancel_close_${interaction.user.id}`)
          .setLabel('No, Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.editReply({
        content: 'Are you sure you want to close this ticket?',
        components: [confirmRow],
      });
    }

    if (interaction.customId.startsWith('cancel_close_')) {
      const userId = interaction.customId.split('_')[2];
      if (interaction.user.id !== userId)
        return interaction.reply({ content: 'You are not allowed to use this button.', ephemeral: true });

      return interaction.reply({ content: 'Ticket close cancelled.', ephemeral: true });
    }

    if (interaction.customId.startsWith('confirm_close_')) {
      const userId = interaction.customId.split('_')[2];
      if (interaction.user.id !== userId)
        return interaction.reply({ content: 'You are not allowed to use this button.', ephemeral: true });

      const data = await TicketSetup.findOne({ guildId: interaction.guildId });
      if (!data) return interaction.reply({ content: 'Ticket setup not found.', ephemeral: true });

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
      if (ticket.status === 'closed')
        return interaction.reply({ content: 'This ticket is already closed.', ephemeral: true });

      try {
        const ticketUser = await interaction.guild.members.fetch(ticket.userId).catch(() => null);

        if (ticketUser) {
          await interaction.channel.permissionOverwrites.edit(ticket.userId, {
            ViewChannel: false,
          });
        }

        let renameFailed = false;
        let skipRenameReason = null;

        // Rename Rate Limit Check
        const now = Date.now();
        const limit = 10 * 60 * 1000; // 10 minutes in ms
        const timestamps = (ticket.renameTimestamps || []).filter(ts => now - new Date(ts).getTime() <= limit);

        if (timestamps.length >= 2) {
          const nextAvailable = new Date(Math.min(...timestamps) + limit);
          const remaining = Math.ceil((nextAvailable - now) / 60000);
          skipRenameReason = `Rename failed: too quick. Try again in ${remaining} minute(s).`;
          renameFailed = true;
        } else {
          const newName = `closed-${ticketUser?.user?.username || 'ticket'}`.slice(0, 30);
          try {
            await interaction.channel.setName(newName);
            // Update timestamps
            ticket.renameTimestamps = [...timestamps, new Date()].slice(-2);
          } catch (err) {
            renameFailed = true;
            skipRenameReason = 'Rename failed due to Discord API error.';
          }
        }

        // Generate button IDs
        const deleteId = `ticket_delete_${Date.now()}`;
        const reopenId = `ticket_reopen_${Date.now()}`;

        ticket.status = 'closed';
        ticket.deleteButtonId = deleteId;
        ticket.reopenButtonId = reopenId;
        data.markModified(`panels.${panelIndex}.tickets`);
        await data.save();

        const closedEmbed = new EmbedBuilder()
          .setColor('Red')
          .setDescription(`Ticket closed by <@${interaction.user.id}>`)
          .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        if (renameFailed && skipRenameReason) {
          closedEmbed.addFields({ name: 'Rename Info', value: skipRenameReason });
        }

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(reopenId).setLabel('Reopen').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId(deleteId).setLabel('Delete').setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [closedEmbed], components: [actionRow] });

        // Send log
        const panel = data.panels[panelIndex];
        if (panel.logsChannel) {
          const logChannel = interaction.guild.channels.cache.get(panel.logsChannel);
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setTitle('TICKET CLOSED')
              .addFields(
                { name: 'Panel Name', value: panel.panelName || 'Unknown', inline: true },
                { name: 'Closed By', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Ticket Creator', value: ticketUser ? `<@${ticket.userId}>` : ticket.userId, inline: true }
              )
              .setColor('Red')
              .setTimestamp();
            await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
          }
        }
      } catch (err) {
        console.error(err);
        return interaction.reply({ content: 'Failed to close the ticket.', ephemeral: true });
      }
    }
  });
};