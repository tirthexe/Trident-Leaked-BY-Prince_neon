const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const TicketSetup = require("../../database/TicketSetup");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "reopen",
  description: "Reopen a closed ticket.",
  aliases: ["open-again"],
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
            `${emoji.error} | This is not a ticket channel, so I can't reopen it.`,
            author,
            client,
            null
          ),
        ],
      });
    }

    if (ticket.status !== "closed") {
      return message.reply({
        embeds: [
          createEmbed(
            "#FFA500",
            `${emoji.info} | This ticket is not closed.`,
            author,
            client,
            null
          ),
        ],
      });
    }

    const ticketCreator = await guild.members.fetch(ticket.userId).catch(() => null);
    const ticketCreatorName = ticketCreator ? ticketCreator.user.username : "unknown";

    // Restore permissions
    if (ticketCreator) {
      await channel.permissionOverwrites.edit(ticketCreator.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });
    }

    // Rename logic with ratelimit
    const now = Date.now();
    const limit = 10 * 60 * 1000;
    const timestamps = (ticket.renameTimestamps || []).filter(ts => now - new Date(ts).getTime() <= limit);

    let renameFailed = false;
    let errorBlock = "";

    if (timestamps.length >= 2) {
      const nextTime = new Date(Math.min(...timestamps) + limit);
      const mins = Math.ceil((nextTime - now) / 60000);
      renameFailed = true;
      errorBlock = `\`\`\`diff\n- ERROR: Rename too fast\n+ You can rename after ${mins} minute(s)\`\`\``;
    } else {
      try {
        const newName = `ticket-${ticketCreatorName}`.slice(0, 30);
        await channel.setName(newName);
        ticket.renameTimestamps = [...timestamps, new Date()].slice(-2);
      } catch {
        renameFailed = true;
        errorBlock = "```diff\n- ERROR: Failed to rename this channel.```";
      }
    }

    ticket.status = "open";
    await setupData.save();

    const reopenEmbed = new EmbedBuilder()
      .setColor(renameFailed ? 0xED4245 : 0x00FF00)
      .setDescription(`> Reopened by <@${author.id}>\n${renameFailed ? errorBlock : ""}`)
      .setFooter({ text: "TRIDENT DEVELOPMENT™", iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await message.channel.send({ embeds: [reopenEmbed] });

    if (panel.logsChannel) {
      const logsChannel = guild.channels.cache.get(panel.logsChannel);
      if (logsChannel?.isTextBased()) {
        const logEmbed = new EmbedBuilder()
          .setColor("Green")
          .setTitle("Ticket Reopened")
          .addFields(
            { name: "Panel", value: panel.panelName || "Unknown", inline: true },
            { name: "Reopened By", value: `<@${author.id}>`, inline: true },
            { name: "Ticket Creator", value: `<@${ticket.userId}>`, inline: true }
          )
          .setTimestamp();

        if (renameFailed) {
          logEmbed.addFields({ name: "Rename Error", value: errorBlock });
        }

        await logsChannel.send({ embeds: [logEmbed] });
      }
    }
  },
};