const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SelectMenuBuilder,
  PermissionsBitField,
} = require('discord.js');
const TicketSetup = require('../../database/TicketSetup');

module.exports = {
  name: 'panelbutton',
  aliases: ['ticketbuttons', 'tb'],
  description: 'Configure the panel button name and emoji.',
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

    // Create the dropdown menu for selecting a panel
    const row = new ActionRowBuilder().addComponents(
      new SelectMenuBuilder()
        .setCustomId('select_panel')
        .setPlaceholder('Select a panel to configure')
        .addOptions(panelOptions)
    );

    // Send the embed with the dropdown menu
    const msg = await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor('Aqua')
          .setTitle('Configure Panel Button')
          .setDescription('Choose a panel to configure from the dropdown menu.'),
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
      const selectedPanel = data.panels[selectedIndex];

      // Generate embed to show panel details
      const generateEmbed = (panel) =>
        new EmbedBuilder()
          .setColor('Blue')
          .setTitle(`Configuring: ${panel.panelName}`)
          .setDescription('Configure button name and emoji.')
          .addFields(
            { name: 'Panel Name', value: panel.panelName, inline: true },
            { name: 'Button Text', value: panel.panelButtonName || 'None', inline: true },
            { name: 'Button Emoji', value: panel.panelButtonEmoji || 'None', inline: true }
          );

      // Create action buttons for editing and testing
      const buttons = () => [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('edit_button_name')
            .setLabel('Edit Button Text')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('edit_button_emoji')
            .setLabel('Edit Button Emoji')
            .setStyle(ButtonStyle.Primary)
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('test')
            .setLabel('Test')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('finish')
            .setLabel('Finish')
            .setStyle(ButtonStyle.Danger)
        ),
      ];

      // Send message for configuring panel
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

        // Helper function for asking input from the user
        const askInput = async (prompt, validation = () => true) => {
          const promptMsg = await message.channel.send(`${message.author}, ${prompt}`);
          const collected = await message.channel.awaitMessages({
            filter: (m) => m.author.id === message.author.id,
            max: 1,
            time: 60000,
          });

          await promptMsg.delete().catch(() => {});
          const userMsg = collected.first();
          if (userMsg) await userMsg.delete().catch(() => {});
          if (!userMsg || !validation(userMsg.content)) {
            return null;
          }
          return userMsg.content;
        };

        // Edit Button Text
        if (btnInt.customId === 'edit_button_name') {
          const newButtonText = await askInput('Enter the new button text:');
          if (newButtonText) {
            selectedPanel.panelButtonName = newButtonText;
          } else {
            return btnInt.followUp({ content: 'Invalid name. Please try again.' });
          }
        }

        // Edit Button Emoji
        if (btnInt.customId === 'edit_button_emoji') {
          const newButtonEmoji = await askInput('Enter the new button emoji (e.g., 😀, :emoji_name:):', (emoji) => {
            const regex = /^<a?:(\w+):(\d+)>$/;
            return emoji.match(regex) || emoji.match(/^[\u{1F600}-\u{1F64F}]*$/u);
          });
          if (newButtonEmoji) {
            selectedPanel.panelButtonEmoji = newButtonEmoji;
          } else {
            return btnInt.followUp({ content: 'Invalid emoji. Please try again.' });
          }
        }

        // Test
        if (btnInt.customId === 'test') {
          const testEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle(selectedPanel.panelName)
            .setDescription(selectedPanel.panelEmbedMessage || 'No embed text provided')
            .setImage(selectedPanel.panelEmbedImage || null)
            .setFooter({ text: 'Trident' });

          const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('ticket_button')
              .setLabel(selectedPanel.panelButtonName || 'Support')
              .setEmoji(selectedPanel.panelButtonEmoji || '🛠️')
              .setStyle(ButtonStyle.Primary)
          );

          await btnInt.channel.send({
            content: selectedPanel.panelNormalMessage || 'No normal message provided',
            embeds: [testEmbed],
            components: [buttonRow],
          });
        }

        // Finish
        if (btnInt.customId === 'finish') {
          await data.save();
          await configMessage.edit({
            embeds: [
              generateEmbed(selectedPanel)
                .setColor('Green')
                .setFooter({ text: 'Configuration completed.' }),
            ],
            components: [],
          });
          buttonCollector.stop();
        }

        await data.save();
        await configMessage.edit({
          embeds: [generateEmbed(selectedPanel)],
          components: buttons(),
        });
      });
    });
  },
};