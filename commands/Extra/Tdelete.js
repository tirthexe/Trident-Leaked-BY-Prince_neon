const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require('discord.js');
const TicketSetup = require('../../database/TicketSetup');

module.exports = {
  name: 'paneldelete',
  description: 'Delete a ticket panel',
  async execute(client, message) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('Only **Admins** can use this command.'),
        ],
      });
    }

    const data = await TicketSetup.findOne({ guildId: message.guild.id });
    if (!data || data.panels.length === 0) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('No panels found to delete. Use `panelcreate` to create one.'),
        ],
      });
    }

    const panelOptions = data.panels.map((p, i) => ({
      label: p.panelName,
      description: `Panel ${i + 1}`,
      value: `${i}`,
    }));

    const dropdown = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('delete_panel_select')
        .setPlaceholder('Select a panel to delete')
        .addOptions(panelOptions)
    );

    const msg = await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor('Red')
          .setTitle('Panel Deletion')
          .setDescription('Select the panel you want to delete from the dropdown below.')
      ],
      components: [dropdown],
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60 * 1000,
      max: 1,
    });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate();

      const index = parseInt(interaction.values[0]);
      const panel = data.panels[index];

      const infoEmbed = new EmbedBuilder()
        .setColor('Orange')
        .setTitle(`Selected Panel: ${panel.panelName}`)
        .addFields(
          { name: 'Panel Name', value: panel.panelName, inline: true },
          {
            name: 'Category',
            value: panel.categoryId ? `<#${panel.categoryId}>` : 'None',
            inline: true,
          },
          {
            name: 'Ticket Channel',
            value: panel.ticketChannel ? `<#${panel.ticketChannel}>` : 'None',
            inline: true,
          },
          {
            name: 'Support Role',
            value: panel.supportRole ? `<@&${panel.supportRole}>` : 'None',
            inline: true,
          },
          {
            name: 'WARNING',
            value: 'If you delete this panel, all settings will be permanently lost. This **cannot be undone**.',
          }
        );

      const confirmButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_delete_panel')
          .setLabel('Yes, Delete')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_delete_panel')
          .setLabel('No, Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

      const confirmMsg = await message.channel.send({
        embeds: [infoEmbed],
        components: [confirmButtons],
      });

      const buttonCollector = confirmMsg.createMessageComponentCollector({
        time: 60 * 1000,
      });

      buttonCollector.on('collect', async (btn) => {
        if (btn.user.id !== message.author.id) {
          return btn.reply({
            content: `You can't perform this action.`,
            ephemeral: true,
          });
        }

        await btn.deferUpdate();

        if (btn.customId === 'confirm_delete_panel') {
          data.panels.splice(index, 1);
          data.markModified('panels');
          await data.save();

          await confirmMsg.edit({
            embeds: [
              new EmbedBuilder()
                .setColor('Green')
                .setTitle('Panel Deleted')
                .setDescription(`✅ The panel **${panel.panelName}** has been deleted successfully.`)
            ],
            components: [],
          });
          buttonCollector.stop();
        } else if (btn.customId === 'cancel_delete_panel') {
          await confirmMsg.edit({
            embeds: [
              new EmbedBuilder()
                .setColor('Blue')
                .setTitle('Cancelled')
                .setDescription(`❌ Panel deletion was cancelled.`),
            ],
            components: [],
          });
          buttonCollector.stop();
        }
      });
    });
  },
};