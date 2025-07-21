const TicketSetup = require("../../database/TicketSetup");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "add",
  description: "Add a user to the ticket.",
  async execute(client, message, args) {
    const { channel, guild, author } = message;

    const setupData = await TicketSetup.findOne({ guildId: guild.id });
    if (!setupData) {
      return message.reply({
        embeds: [
          createEmbed("#FF0000", `${emoji.error} | Ticket system is not set up.`, author, client, null),
        ],
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
      return message.reply({
        embeds: [
          createEmbed("#FF0000", `${emoji.error} | This is not a ticket channel.`, author, client, null),
        ],
      });
    }

    if (!args[0]) {
      return message.reply({
        embeds: [
          createEmbed("#FF0000", `${emoji.error} | Please mention a user or provide a user ID | add <user mention/userid>.`, author, client, null),
        ],
      });
    }

    const userId = args[0].replace(/[<@!>]/g, "");
    const user = await guild.members.fetch(userId).catch(() => null);

    if (!user) {
      return message.reply({
        embeds: [
          createEmbed("#FF0000", `${emoji.error} | Couldn't find the specified user.`, author, client, null),
        ],
      });
    }

    await channel.permissionOverwrites.edit(user.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });

    return message.reply({
      embeds: [
        createEmbed("#00FF00", `${emoji.tick} | <@${user.id}> added to this ticket.`, author, client, null),
      ],
    });
  },
};