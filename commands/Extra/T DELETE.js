const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const TicketSetup = require("../../database/TicketSetup");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "delete",
  description: "Delete a ticket channel.",
  aliases: ["delete-ticket"],
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
    let ticketIndex = -1;
    for (const p of setupData.panels) {
      const index = p.tickets.findIndex(t => t.channelId === channel.id);
      if (index !== -1) {
        panel = p;
        ticketIndex = index;
        break;
      }
    }

    if (!panel || ticketIndex === -1) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | This is not a ticket channel, so I can't delete it.`,
            author,
            client,
            null
          ),
        ],
      });
    }

    const ticket = panel.tickets[ticketIndex];

    // Remove from DB
    panel.tickets.splice(ticketIndex, 1);
    await setupData.save();

    // Send to logs
    if (panel.logsChannel) {
      const logsChannel = guild.channels.cache.get(panel.logsChannel);
      if (logsChannel && logsChannel.isTextBased()) {
        const logEmbed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("Ticket Deleted")
          .addFields(
            { name: "Panel", value: panel.panelName || "Unknown", inline: true },
            { name: "Deleted By", value: `<@${author.id}>`, inline: true },
            { name: "Ticket Creator", value: `<@${ticket.userId}>`, inline: true }
          )
          .setTimestamp();

        await logsChannel.send({ embeds: [logEmbed] });
      }
    }

    // Notify and delete channel
    await message.reply({
      embeds: [
        createEmbed(
          "#FF0000",
          `${emoji.tick} | Ticket deleted by <@${author.id}>. Deleting this channel in 3 seconds...`,
          author,
          client,
          null
        ),
      ],
    });

    setTimeout(() => {
      channel.delete().catch(() => {});
    }, 3000);
  },
};