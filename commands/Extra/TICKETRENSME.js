const TicketSetup = require("../../database/TicketSetup");
const { EmbedBuilder } = require("discord.js");
const emoji = require("../../emoji");

module.exports = {
  name: "rename",
  aliases: ['ticketrename', 'trename'],
  description: "Rename a ticket channel.",
  async execute(client, message, args) {
    const { channel, guild, author } = message;

    const setupData = await TicketSetup.findOne({ guildId: guild.id });
    if (!setupData) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(`${emoji.error} | Ticket system is not set up | use **/panelcreate**.`)
            .setFooter({ text: "TRIDENT DEVELOPMENT™", iconURL: client.user.displayAvatarURL() })
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

    if (!ticket) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(`${emoji.error} | This is not a ticket channel.`)
            .setFooter({ text: "TRIDENT DEVELOPMENT™", iconURL: client.user.displayAvatarURL() })
        ],
      });
    }

    const newName = args.join("-").toLowerCase().replace(/[^a-z0-9\-]/gi, "").slice(0, 30);
    if (!newName || newName.length < 2) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(`${emoji.error} | Please provide a valid new name.`)
            .setFooter({ text: "TRIDENT DEVELOPMENT™", iconURL: client.user.displayAvatarURL() })
        ],
      });
    }

    const now = Date.now();
    const limit = 10 * 60 * 1000;
    const timestamps = (ticket.renameTimestamps || []).filter(ts => now - new Date(ts).getTime() <= limit);

    if (timestamps.length >= 2) {
      const nextAllowed = new Date(Math.min(...timestamps) + limit);
      const minutesLeft = Math.ceil((nextAllowed - now) / 60000);

      return channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(`> Renamed by <@${author.id}>\n\`\`\`diff\n- ERROR: Too many renames\n+ Try again in ${minutesLeft} minute(s)\`\`\``)
            .setFooter({ text: "TRIDENT DEVELOPMENT™", iconURL: client.user.displayAvatarURL() })
            .setTimestamp()
        ],
      });
    }

    try {
      await channel.setName(newName);
      ticket.renameTimestamps = [...timestamps, new Date()].slice(-2);
      await setupData.save();

      return channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(`> Renamed by <@${author.id}>\n\`\`\`diff\n+ Ticket renamed to: ${newName}\`\`\``)
            .setFooter({ text: "TRIDENT DEVELOPMENT™", iconURL: client.user.displayAvatarURL() })
            .setTimestamp()
        ],
      });
    } catch {
      return channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(`> Renamed by <@${author.id}>\n\`\`\`diff\n- ERROR: Failed to rename this channel.\`\`\``)
            .setFooter({ text: "TRIDENT DEVELOPMENT™", iconURL: client.user.displayAvatarURL() })
            .setTimestamp()
        ],
      });
    }
  },
};