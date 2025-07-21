const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const TicketSetup = require('../../database/TicketSetup');

module.exports = {
  name: 'panelreset',
  aliases: ['ticketreset','panelreset'],
  description: 'Reset all ticket panels with confirmation (Admin only)',

  async execute(client, message) {
    // Admin check
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('Only administrators can use this command.')
        ]
      });
    }

    const ticketData = await TicketSetup.findOne({ guildId: message.guild.id });
    if (!ticketData || !ticketData.panels.length) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('There are no panels to reset.')
        ]
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

    const msg = await message.reply({ embeds: [confirmEmbed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      time: 15000,
      filter: i => i.user.id === message.author.id,
    });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'panel_reset_yes') {
        await TicketSetup.findOneAndDelete({ guildId: message.guild.id });

        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor('Green')
              .setDescription('All ticket panels have been successfully **reset**.')
          ],
          components: []
        });

      } else if (interaction.customId === 'panel_reset_no') {
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor('Grey')
              .setDescription('Panel reset has been **cancelled**.')
          ],
          components: []
        });
      }
    });
  }
};