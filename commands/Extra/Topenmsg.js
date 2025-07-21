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
  name: 'panelopenmessage',
  aliases: ['ticketopenmessage', 'tom'],
  description: 'Configure the open panel message with normal and embed text.',
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
          .setTitle('Configure Open Panel Message')
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
          .setDescription('Configure normal text and embed text | use {user} for mention ticket owner.')
          .addFields(
            { name: 'Panel Name', value: panel.panelName, inline: true },
            { name: 'Normal Text', value: panel.panelOpenNormalMessage || 'None', inline: true },
            { name: 'Embed Text', value: panel.panelOpenEmbedMessage || 'None', inline: true }
          );

      const buttons = () => [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('edit_normal_text')
            .setLabel('Edit Normal Text')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('edit_embed_text')
            .setLabel('Edit Embed Text')
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

        // Edit Normal Text
        if (btnInt.customId === 'edit_normal_text') {
          const newText = await askInput('Enter the new normal text (max 10 lines):', (text) => text.split('\n').length <= 10);
          if (newText) {
            selectedPanel.panelOpenNormalMessage = newText;
          } else {
            return btnInt.followUp({ content: 'Invalid text or too many lines. Please try again.' });
          }
        }

        // Edit Embed Text
        if (btnInt.customId === 'edit_embed_text') {
          const newEmbedText = await askInput('Enter the new embed text (max 500 characters):', (text) => text.length <= 500);
          if (newEmbedText) {
            selectedPanel.panelOpenEmbedMessage = newEmbedText;
          } else {
            return btnInt.followUp({ content: 'Invalid embed text or too many characters. Please try again.' });
          }
        }

        // Test
        if (btnInt.customId === 'test') {
          const testEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle(selectedPanel.panelName)
            .setDescription(selectedPanel.panelOpenEmbedMessage || 'No embed text provided')
            .setFooter({ text: 'Trident' });

          await btnInt.channel.send({
            content: selectedPanel.panelOpenNormalMessage || 'No normal message provided',
            embeds: [testEmbed],
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