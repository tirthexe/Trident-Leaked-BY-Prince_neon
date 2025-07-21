const { SlashCommandBuilder } = require("discord.js");
const TicketSetup = require("../../database/TicketSetup");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-rename")
    .setDescription("Rename the current ticket channel.")
    .addStringOption(option =>
      option
        .setName("name")
        .setDescription("New name for the ticket channel.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const { channel, guild, user, client } = interaction;

    const setupData = await TicketSetup.findOne({ guildId: guild.id });
    if (!setupData) {
      return interaction.reply({
        embeds: [
          createEmbed("#FF0000", `${emoji.error} | Ticket system is not set up | use **Panelcreate**.`, user, client, null),
        ],
        ephemeral: true,
      });
    }

    let isTicket = false;
    for (const panel of setupData.panels) {
      if (panel.tickets.some(t => t.channelId === channel.id)) {
        isTicket = true;
        break;
      }
    }

    if (!isTicket) {
      return interaction.reply({
        embeds: [
          createEmbed("#FF0000", `${emoji.error} | This is not a ticket channel.`, user, client, null),
        ],
        ephemeral: true,
      });
    }

    const rawName = interaction.options.getString("name");
    const sanitized = rawName.toLowerCase().replace(/[^a-z0-9\-]/gi, "").slice(0, 100);

    if (!sanitized || sanitized.length < 2) {
      return interaction.reply({
        embeds: [
          createEmbed("#FF0000", `${emoji.error} | Invalid name after cleanup. Try using more alphanumeric characters.`, user, client, null),
        ],
        ephemeral: true,
      });
    }

    try {
      await channel.setName(sanitized);
      return interaction.reply({
        embeds: [
          createEmbed("#00FF00", `${emoji.tick} | Ticket name changed to **${sanitized}**.`, user, client, null),
        ],
      });
    } catch (err) {
      console.error(err);
      return interaction.reply({
        embeds: [
          createEmbed("#FF0000", `${emoji.error} | Failed to rename the channel.`, user, client, null),
        ],
        ephemeral: true,
      });
    }
  },
};