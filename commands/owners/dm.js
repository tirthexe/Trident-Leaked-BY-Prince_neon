const { ownerID, developerIDs } = require("../../owner"); // Import owner and developer IDs

module.exports = {
  name: "dm",
  description: "Send a direct message to a specified user.",
  execute(client, message, args) {
    // Check if the user is an owner or developer
    if (![ownerID, ...developerIDs].includes(message.author.id)) return;

    // Extract the user mention or ID and the message
    const userId = args.shift()?.replace(/[<@!>]/g, ""); // Get user ID from mention
    const text = args.join(" "); // Combine the remaining arguments into the message

    if (!userId || !text) {
      return message.channel.send("Please provide a valid user and message.").then(msg => setTimeout(() => msg.delete(), 5000));
    }

    // Fetch the user and send the DM
    const user = client.users.cache.get(userId);
    if (!user) {
      return message.channel.send("Unable to find the user.").then(msg => setTimeout(() => msg.delete(), 5000));
    }

    user
      .send(text)
      .then(() => message.channel.send(`Message sent to <@${userId}>.`).then(msg => setTimeout(() => msg.delete(), 5000)))
      .catch(() =>
        message.channel.send("Failed to send the message.").then(msg => setTimeout(() => msg.delete(), 5000))
      );

    message.delete().catch(() => {}); // Delete the user's command message silently
  },
};