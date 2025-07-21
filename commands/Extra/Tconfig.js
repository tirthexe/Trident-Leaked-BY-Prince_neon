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
  name: 'panelconfig',
  aliases: ['ticketconfig' , 'ticketsetting','ts'],
  description: 'Configure your existing ticket panels.',
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
            .setDescription('No panels found. Use `panelcreate` to create one.'),
        ],
      });
    }

    const panelOptions = data.panels.map((p, index) => ({
      label: p.panelName,
      description: `Panel ${index + 1}`,
      value: `${index}`,
    }));

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_panel')
        .setPlaceholder('Select a panel to configure')
        .addOptions(panelOptions)
    );

    const msg = await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor('Aqua')
          .setTitle('Panel Configuration')
          .setDescription('Choose a panel to configure from the dropdown.'),
      ],
      components: [row],
    });

    const menuCollector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 3 * 60 * 1000,
      max: 1,
    });

    menuCollector.on('collect', async (interaction) => {
      await interaction.deferUpdate();

      const selectedIndex = parseInt(interaction.values[0]);
      let selectedPanel = data.panels[selectedIndex];

      const generateEmbed = (panel) =>
        new EmbedBuilder()
          .setColor('Blue')
          .setTitle(`Configuring: ${panel.panelName}`)
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
              name: 'Logs Channel',
              value: panel.logsChannel ? `<#${panel.logsChannel}>` : 'None',
              inline: true,
            }
          );

      const buttons = () => [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('edit_name')
            .setLabel('Edit Name')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('edit_category')
            .setLabel('Edit Category')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('edit_role')
            .setLabel('Edit Role')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('edit_channel')
            .setLabel('Edit Channel')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('edit_log')
            .setLabel('Edit Logs')
            .setStyle(ButtonStyle.Primary)
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('finish')
            .setLabel('Finish')
            .setStyle(ButtonStyle.Danger)
        ),
      ];

      const configMessage = await message.channel.send({
        embeds: [generateEmbed(selectedPanel)],
        components: buttons(),
      });

      const buttonCollector = configMessage.createMessageComponentCollector({
        time: 10 * 60 * 1000,
      });

      buttonCollector.on('collect', async (btnInt) => {
        if (btnInt.user.id !== message.author.id) {
          return btnInt.reply({
            content: `You can't manage this panel.`,
            ephemeral: true,
          });
        }

        await btnInt.deferUpdate();

        const askInput = async (prompt) => {
          const promptMsg = await message.channel.send(`${message.author}, ${prompt}`);
          const collected = await message.channel.awaitMessages({
            filter: (m) => m.author.id === message.author.id,
            max: 1,
            time: 60000,
          });

          await promptMsg.delete().catch(() => {});
          const userMsg = collected.first();
          if (userMsg) await userMsg.delete().catch(() => {});
          return userMsg?.content;
        };

        if (btnInt.customId === 'edit_name') {
          const newName = await askInput('Please provide the new panel name:');
          if (newName) selectedPanel.panelName = newName;
        }

        if (btnInt.customId === 'edit_category') {
          const input = await askInput('Provide the category ID or mention it (or `none` to clear):');
          if (input) {
            selectedPanel.categoryId = input.toLowerCase() === 'none' ? null : input.replace(/[<#>]/g, '');
          }
        }

        if (btnInt.customId === 'edit_role') {
          const input = await askInput('Provide the role ID or mention it (or `none` to clear):');
          if (input) {
            selectedPanel.supportRole = input.toLowerCase() === 'none' ? null : input.replace(/[<@&>]/g, '');
          }
        }

        if (btnInt.customId === 'edit_channel') {
          const input = await askInput('Provide the channel ID or mention it (or `none` to clear):');
          if (input) {
            selectedPanel.ticketChannel = input.toLowerCase() === 'none' ? null : input.replace(/[<#>]/g, '');
          }
        }

        if (btnInt.customId === 'edit_log') {
          const input = await askInput('Provide the logs channel ID or mention it (or `none` to clear):');
          if (input) {
            selectedPanel.logsChannel = input.toLowerCase() === 'none' ? null : input.replace(/[<#>]/g, '');
          }
        }

        if (btnInt.customId === 'finish') {
          await data.save();
          await configMessage.edit({
            embeds: [
              generateEmbed(selectedPanel)
                .setColor('Green')
                .setFooter({ text: 'Panel configuration saved and finished.' }),
            ],
            components: [],
          });
          buttonCollector.stop();
          return;
        }

        data.markModified('panels');
        await data.save();

        await configMessage.edit({
          embeds: [generateEmbed(selectedPanel)],
          components: buttons(),
        });
      });
    });
  },
};