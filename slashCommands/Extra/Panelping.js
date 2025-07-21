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
    .setName('ticket-inavtive-emessage')
    .setDescription('Configure the ticket ping panel message with normal and embed text.'),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('Only **Admins** can use this command.'),
        ],
        ephemeral: true,
      });
    }

    const data = await TicketSetup.findOne({ guildId: interaction.guild.id });
    if (!data || data.panels.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('No panels found. Use `/panelcreate` to create one.'),
        ],
        ephemeral: true,
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

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Aqua')
          .setTitle('Configure Ping Panel Message')
          .setDescription('Choose a panel to configure from the dropdown.'),
      ],
      components: [row],
    });

    const menuCollector = interaction.channel.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id && i.customId === 'select_panel',
      time: 3 * 60 * 1000,
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
          .setDescription('Configure normal text and embed text. Use `{user}` to mention the ticket owner.')
          .addFields(
            { name: 'Panel Name', value: panel.panelName, inline: true },
            { name: 'Normal Text', value: panel.panelPingNormalMessage || 'None', inline: true },
            { name: 'Embed Text', value: panel.panelPingEmbedMessage || 'None', inline: true }
          );

      const buttons = () => [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('edit_normal_text').setLabel('Edit Normal Text').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('edit_embed_text').setLabel('Edit Embed Text').setStyle(ButtonStyle.Primary)
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('test').setLabel('Test').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('finish').setLabel('Finish').setStyle(ButtonStyle.Danger)
        ),
      ];

      const configMessage = await i.followUp({
        embeds: [generateEmbed(selectedPanel)],
        components: buttons(),
      });

      const buttonCollector = configMessage.createMessageComponentCollector({
        time: 10 * 60 * 1000,
      });

      buttonCollector.on('collect', async (btnInt) => {
        if (btnInt.user.id !== interaction.user.id) {
          return btnInt.reply({
            content: `You can't manage this panel.`,
            ephemeral: true,
          });
        }

        await btnInt.deferUpdate();

        const askInput = async (prompt, validation = () => true) => {
          await btnInt.followUp({ content: `${interaction.user}, ${prompt}`, ephemeral: true });

          const messageCollector = interaction.channel.createMessageCollector({
            filter: (m) => m.author.id === interaction.user.id,
            max: 1,
            time: 60000,
          });

          return new Promise((resolve) => {
            messageCollector.on('collect', async (msg) => {
              await msg.delete().catch(() => {});
              if (!validation(msg.content)) return resolve(null);
              resolve(msg.content);
            });
            messageCollector.on('end', (collected) => {
              if (collected.size === 0) resolve(null);
            });
          });
        };

        if (btnInt.customId === 'edit_normal_text') {
          const newText = await askInput('Enter the new normal text (max 10 lines):', (text) => text.split('\n').length <= 10);
          if (newText) {
            selectedPanel.panelPingNormalMessage = newText;
          } else {
            return btnInt.followUp({ content: 'Invalid or too long. Try again.', ephemeral: true });
          }
        }

        if (btnInt.customId === 'edit_embed_text') {
          const newEmbedText = await askInput('Enter the new embed text (max 500 characters):', (text) => text.length <= 500);
          if (newEmbedText) {
            selectedPanel.panelPingEmbedMessage = newEmbedText;
          } else {
            return btnInt.followUp({ content: 'Too long or invalid. Try again.', ephemeral: true });
          }
        }

        if (btnInt.customId === 'test') {
          const testEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle(selectedPanel.panelName)
            .setDescription(selectedPanel.panelPingEmbedMessage || 'No embed text provided')
            .setFooter({ text: 'Trident' });

          await interaction.channel.send({
            content: selectedPanel.panelPingNormalMessage?.replace('{user}', `<@${interaction.user.id}>`) || 'No normal message provided',
            embeds: [testEmbed],
          });
        }

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