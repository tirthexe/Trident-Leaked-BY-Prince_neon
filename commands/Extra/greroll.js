const {
  PermissionsBitField,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const emoji = require("../../emoji");

module.exports = {
  name: "greroll",
  aliases: ["giveawayreroll", "reroll"],
  description: "Reroll a giveaway",
  async execute(client, message, args) {
    if (
      !message.guild ||
      !message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)
    ) {
      return message.reply({
        content: "You need the **Manage Messages** permission to use this command.",
      });
    }

    // Determine which message to reroll
    let targetMessage;
    if (message.reference) {
      try {
        targetMessage = await message.channel.messages.fetch(
          message.reference.messageId
        );
      } catch {
        return message.reply({
          content: "Failed to fetch the replied message.",
        });
      }
    } else if (args[0]) {
      try {
        targetMessage = await message.channel.messages.fetch(args[0]);
      } catch {
        return message.reply({
          content:
            "Invalid message ID or message not found in this channel.",
        });
      }
    } else {
      return message.reply({
        content:
          "Please provide a message ID or reply to the giveaway message to reroll.\nExample: `greroll <messageID>` or reply to the giveaway message.",
      });
    }

    // Check if message was sent by the bot and contains "GIVEAWAY"
    if (
      targetMessage.author.id !== client.user.id ||
      !targetMessage.content.toLowerCase().includes("giveaway")
    ) {
      return message.reply({
        content:
          "The selected message is not a valid giveaway message sent by me.",
      });
    }

    // Force fetch to ensure reactions are up to date
    await targetMessage.fetch();

    // Get the reaction
    const reaction = targetMessage.reactions.cache.get(emoji.react);
    if (!reaction) {
      return message.reply({
        content: "No reactions found on the giveaway message.",
      });
    }

    // Fetch users who reacted
    const users = await reaction.users.fetch().catch(() => null);
    if (!users) {
      return message.reply({
        content: "Failed to fetch users who reacted.",
      });
    }

    const validUsers = users.filter((u) => !u.bot);
    if (!validUsers.size) {
      return message.reply({
        content: "No valid entries found for reroll.",
      });
    }

    // Pick one random winner
    const entrants = [...validUsers.values()];
    const winner = entrants[Math.floor(Math.random() * entrants.length)];

    // Create button to view giveaway
    const viewButton = new ButtonBuilder()
      .setLabel("View Giveaway")
      .setStyle(ButtonStyle.Link)
      .setURL(
        `https://discord.com/channels/${message.guildId}/${message.channelId}/${targetMessage.id}`
      );

    const row = new ActionRowBuilder().addComponents(viewButton);

    // Send result
    return message.channel.send({
      content: `${emoji.dreact} Congratulations <@${winner.id}>! You are the new winner!`,
      components: [row],
    });
  },
};