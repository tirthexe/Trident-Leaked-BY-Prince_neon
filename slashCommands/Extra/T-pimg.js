const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const TicketSetup = require("../../database/TicketSetup");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-inactive")
    .setDescription("Ping the ticket creator about inactivity."),

  async execute(interaction) {
    const { guild, channel, user, client } = interaction;

    const setupData = await TicketSetup.findOne({ guildId: guild.id });
    if (!setupData) {
      return interaction.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | Ticket system is not set up in this server.`,
            user,
            client,
            null
          ),
        ],
        ephemeral: true,
      });
    }

    let panel = null;
    let ticket = null;
    for (const p of setupData.panels) {
      const found = p.tickets.find(t => t.channelId === channel.id);
      if (found) {
        panel = p;
        ticket = found;
        break;
      }
    }

    if (!panel || !ticket) {
      return interaction.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | This is not a ticket channel, so I can't ping anyone.`,
            user,
            client,
            null
          ),
        ],
        ephemeral: true,
      });
    }

    const ticketUserMention = `<@${ticket.userId}>`;

    const normalContent = panel.panelPingNormalMessage
      ? panel.panelPingNormalMessage.replace(/\{user\}/g, ticketUserMention)
      : `Hey ${ticketUserMention}, your ticket seems inactive. Please let us know if you still need help, otherwise we may close the ticket soon.`;

    const embedDescription = panel.panelPingEmbedMessage
      ? panel.panelPingEmbedMessage.replace(/\{user\}/g, ticketUserMention)
      : "This ticket seems to be inactive.\nIf you still need help, please respond. Otherwise, we may delete this ticket soon.";

    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setDescription(embedDescription)
      .setFooter({ text: `Pinged by ${user.tag}`, iconURL: user.displayAvatarURL() })
      .setTimestamp();

    // Send the reminder
    await channel.send({
      content: normalContent,
      embeds: [embed],
    });

    return interaction.reply({
      content: `${emoji.tick} | Reminder sent.`,
      ephemeral: true,
    });
  },
};