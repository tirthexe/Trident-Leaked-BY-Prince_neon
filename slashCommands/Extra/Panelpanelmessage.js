const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require('discord.js');
const TicketSetup = require('../../database/TicketSetup');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel-message')
    .setDescription('Configure the ticket panel message with normal text, embed text, and image.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    await interaction.deferReply();

    const data = await TicketSetup.findOne({ guildId: interaction.guild.id });
    if (!data || data.panels.length === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('No panels found. Use `/panelcreate` to create one.'),
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

    const msg = await interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setColor('Aqua')
          .setTitle('Configure Panel Message')
          .setDescription('Choose a panel to configure from the dropdown.'),
      ],
      components: [row],
    });

    const menuCollector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 180000,
      max: 1,
    });

    menuCollector.on('collect', async (i) => {
      await i.deferUpdate();
      const selectedIndex = parseInt(i.values[0]);
      let selectedPanel = data.panels[selectedIndex];

      const generateEmbed = (panel) =>
        new EmbedBuilder()
          .setColor('Blue')
          .setTitle(`Configuring: ${panel.panelName}`)
          .setDescription('Configure normal text, embed text, and image.')
          .addFields(
            { name: 'Panel Name', value: panel.panelName, inline: true },
            { name: 'Normal Text', value: panel.panelNormalMessage || 'None', inline: true },
            { name: 'Embed Text', value: panel.panelEmbedMessage || 'None', inline: true },
            { name: 'Embed Image', value: panel.panelEmbedImage || 'None', inline: true }
          );

      const buttons = () => [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('edit_normal_text').setLabel('Edit Normal Text').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('edit_embed_text').setLabel('Edit Embed Text').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('edit_image').setLabel('Edit Image').setStyle(ButtonStyle.Primary)
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('test').setLabel('Test').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('finish').setLabel('Finish').setStyle(ButtonStyle.Danger)
        ),
      ];

      const configMessage = await interaction.channel.send({
        embeds: [generateEmbed(selectedPanel)],
        components: buttons(),
      });

      const buttonCollector = configMessage.createMessageComponentCollector({
        time: 600000,
      });

      buttonCollector.on('collect', async (btnInt) => {
        if (btnInt.user.id !== interaction.user.id) {
          return btnInt.reply({ content: `You can't manage this panel.`, });
        }

        await btnInt.deferUpdate();

        const askInput = async (prompt, validation = () => true) => {
          const promptMsg = await interaction.channel.send(`${interaction.user}, ${prompt}`);
          const collected = await interaction.channel.awaitMessages({
            filter: (m) => m.author.id === interaction.user.id,
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

        if (btnInt.customId === 'edit_normal_text') {
          const newText = await askInput('Enter the new normal text (max 10 lines):', (text) => text.split('\n').length <= 10);
          if (newText) {
            selectedPanel.panelNormalMessage = newText;
          } else {
            return btnInt.followUp({ content: 'Invalid text or too many lines. Please try again.', ephemeral: true });
          }
        }

        if (btnInt.customId === 'edit_embed_text') {
          const newEmbedText = await askInput('Enter the new embed text (max 500 characters):', (text) => text.length <= 500);
          if (newEmbedText) {
            selectedPanel.panelEmbedMessage = newEmbedText;
          } else {
            return btnInt.followUp({ content: 'Invalid embed text or too many characters. Please try again.', ephemeral: true });
          }
        }

        if (btnInt.customId === 'edit_image') {
          const newImageUrl = await askInput('Enter the new image URL (must be a valid URL):', (url) => {
            try {
              const parsedUrl = new URL(url);
              const ext = parsedUrl.pathname.split('.').pop();
              return ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(ext?.toLowerCase());
            } catch {
              return false;
            }
          });
          if (newImageUrl) {
            selectedPanel.panelEmbedImage = newImageUrl;
          } else {
            return btnInt.followUp({ content: 'Invalid image URL. Please try again.', ephemeral: true });
          }
        }

        if (btnInt.customId === 'test') {
          const testEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle(selectedPanel.panelName)
            .setDescription(selectedPanel.panelEmbedMessage || 'No embed text provided')
            .setImage(selectedPanel.panelEmbedImage || null)
            .setFooter({ text: 'Trident' });

          await btnInt.channel.send({
            content: selectedPanel.panelNormalMessage || 'No normal message provided',
            embeds: [testEmbed],
          });
        }

        if (btnInt.customId === 'finish') {
          await data.save();
          await configMessage.edit({
            embeds: [generateEmbed(selectedPanel).setColor('Green').setFooter({ text: 'Configuration completed.' })],
            components: [],
          });
          return buttonCollector.stop();
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