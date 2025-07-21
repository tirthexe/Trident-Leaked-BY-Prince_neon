const { ownerID, developerIDs } = require("../../owner"); // Import owner and developer IDs

module.exports = {
  name: "say",
  description: "The bot repeats what the owner says.",
  execute(client, message, args) {
    // Check if the user is an owner or developer
    if (![ownerID, ...developerIDs].includes(message.author.id)) return;

    const text = args.join(" "); // Combine all arguments into a single string
    if (!text) return;

    message.delete().catch(() => {}); // Delete the user's message silently
    message.channel.send(text); // Bot sends the message
  },
};