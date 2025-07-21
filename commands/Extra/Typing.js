const { EmbedBuilder } = require("discord.js");
const TicketSetup = require("../../database/TicketSetup");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "tping",
  description: "Ping the ticket creator about inactivity.",
  aliases: ["inactive", "remind"],
  async execute(client, message, args) {
    const { guild, channel, author } = message;

    const setupData = await TicketSetup.findOne({ guildId: guild.id });
    if (!setupData) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | Ticket system is not set up in this server.`,
            author,
            client,
            null
          ),
        ],
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
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | This is not a ticket channel, so I can't ping anyone.`,
            author,
            client,
            null
          ),
        ],
      });
    }

    const ticketUserMention = `<@${ticket.userId}>`;

    // Prepare message content and embed
    const normalContent = panel.panelPingNormalMessage
      ? panel.panelPingNormalMessage.replace(/\{user\}/g, ticketUserMention)
      : `Hey ${ticketUserMention}, your ticket seems inactive. Please let us know if you still need help, otherwise we may close the ticket soon.`;

    const embedDescription = panel.panelPingEmbedMessage
      ? panel.panelPingEmbedMessage.replace(/\{user\}/g, ticketUserMention)
      : "This ticket seems to be inactive.\nIf you still need help, please respond. Otherwise, we may delete this ticket soon.";

    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setDescription(embedDescription)
      .setFooter({ text: `Pinged by ${author.tag}`, iconURL: author.displayAvatarURL() })
      .setTimestamp();

    // Send both together
    await channel.send({
      content: normalContent,
      embeds: [embed],
    });

    return message.react("✅").catch(() => {});
  },
};