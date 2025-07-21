module.exports = (client) => {
  client.on("messageDelete", async (message) => {
    if (!message || message.author?.bot || !message.guild) return;

    // Initialize storage if not present
    if (!client.snipedMessages) client.snipedMessages = {};
    if (!client.snipedMessages[message.channel.id]) {
      client.snipedMessages[message.channel.id] = [];
    }

    const deletedMessage = {
      content: message.content || "No content",
      author: message.author?.tag || "Unknown author",
      timestamp: message.createdTimestamp || Date.now(),
    };

    client.snipedMessages[message.channel.id].push(deletedMessage);

    // Keep only the most recent message
    if (client.snipedMessages[message.channel.id].length > 1) {
      client.snipedMessages[message.channel.id].shift();
    }
  });
};