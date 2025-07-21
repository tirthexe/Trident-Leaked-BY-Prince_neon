const { ownerID, developerIDs } = require("../../owner"); // Import owner and developer IDs
const { ChannelType } = require("discord.js");

module.exports = {
  name: "send",
  description: "Send a message to a specified channel (owner/developer only)",
  execute(client, message, args) {
    // Check if the user is an owner or developer
    if (![ownerID, ...developerIDs].includes(message.author.id)) return;

    const channel = message.mentions.channels.first();
    if (!channel || channel.type !== ChannelType.GuildText) {
      return message.reply("Please mention a valid text channel.");
    }

    const text = args.slice(1).join(" "); // Remove channel mention and join the rest
    if (!text) return message.reply("Please provide a message to send.");

    message.delete().catch(() => {}); // Delete the command message silently
    channel.send(text); // Send the message in the mentioned channel
  },
};