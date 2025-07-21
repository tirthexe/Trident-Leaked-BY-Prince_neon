const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const TicketSetup = require('../database/TicketSetup');

module.exports = (client) => {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('ticket_reopen_')) {
      await interaction.deferReply({ ephemeral: true });

      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_reopen_${interaction.user.id}`)
          .setLabel('Yes, Reopen Ticket')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`cancel_reopen_${interaction.user.id}`)
          .setLabel('No, Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.editReply({
        content: '**Are you sure you want to reopen this ticket?**',
        components: [confirmRow],
      });
    }

    if (interaction.customId.startsWith('cancel_reopen_')) {
      const userId = interaction.customId.split('_')[2];
      if (interaction.user.id !== userId)
        return interaction.reply({ content: 'You cannot use this button.', ephemeral: true });

      return interaction.reply({ content: 'Ticket reopen cancelled.', ephemeral: true });
    }

    if (interaction.customId.startsWith('confirm_reopen_')) {
      const userId = interaction.customId.split('_')[2];
      if (interaction.user.id !== userId)
        return interaction.reply({ content: 'You cannot use this button.', ephemeral: true });

      const data = await TicketSetup.findOne({ guildId: interaction.guildId });
      if (!data) return interaction.reply({ content: 'Ticket data not found.', ephemeral: true });

      let panelIndex = -1;
      let ticketIndex = -1;
      for (let i = 0; i < data.panels.length; i++) {
        ticketIndex = data.panels[i].tickets.findIndex(t => t.channelId === interaction.channel.id && t.status === 'closed');
        if (ticketIndex !== -1) {
          panelIndex = i;
          break;
        }
      }

      if (panelIndex === -1 || ticketIndex === -1)
        return interaction.reply({ content: 'Ticket not found or already open.', ephemeral: true });

      const ticket = data.panels[panelIndex].tickets[ticketIndex];
      const ticketCreatorId = ticket.userId;

      try {
        await interaction.channel.permissionOverwrites.edit(ticketCreatorId, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });

        const now = Date.now();
        const limit = 10 * 60 * 1000;
        const timestamps = (ticket.renameTimestamps || []).filter(ts => now - new Date(ts).getTime() <= limit);

        let renameFailed = false;
        let errorMessage = null;

        if (timestamps.length >= 2) {
          const nextAvailable = new Date(Math.min(...timestamps) + limit);
          const remaining = Math.ceil((nextAvailable - now) / 60000);
          renameFailed = true;
          errorMessage = `\`\`\`diff\n- ERROR: Rename too fast\n+ You can rename after ${remaining} minute(s)\`\`\``;
        } else {
          const ticketCreator = await interaction.guild.members.fetch(ticketCreatorId).catch(() => null);
          const newChannelName = `ticket-${ticketCreator?.user?.username || 'ticket'}`.slice(0, 30);
          try {
            await interaction.channel.setName(newChannelName);
            ticket.renameTimestamps = [...timestamps, new Date()].slice(-2);
          } catch {
            renameFailed = true;
            errorMessage = '```diff\n- ERROR: Discord API failed to rename the channel.```';
          }
        }

        ticket.status = 'open';
        data.markModified(`panels.${panelIndex}.tickets`);
        await data.save();

        const embed = new EmbedBuilder()
          .setColor(renameFailed ? 0xED4245 : 0x3498DB) // Red if error, Blue if fine
          .setTitle('Ticket Reopened')
          .setDescription(`> Reopened by <@${interaction.user.id}>`)
          .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        if (renameFailed && errorMessage) embed.addFields({ name: 'Rename Notice', value: errorMessage });

        await interaction.channel.send({ embeds: [embed] });

        const logsChannelId = data.panels[panelIndex].logsChannel;
        const logsChannel = interaction.guild.channels.cache.get(logsChannelId);
        if (logsChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('TICKET REOPENED')
            .addFields(
              { name: 'Panel', value: data.panels[panelIndex].panelName || 'Unknown', inline: true },
              { name: 'Reopened By', value: `<@${interaction.user.id}>`, inline: true },
              { name: 'User', value: `<@${ticketCreatorId}>`, inline: true }
            )
            .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

          if (renameFailed && errorMessage) logEmbed.addFields({ name: 'Rename Error', value: errorMessage });

          await logsChannel.send({ embeds: [logEmbed] });
        }

        return interaction.reply({ content: 'Ticket successfully reopened.', ephemeral: true });
      } catch (err) {
        console.error(err);
        return interaction.reply({ content: 'Failed to reopen the ticket.', ephemeral: true });
      }
    }
  });
};