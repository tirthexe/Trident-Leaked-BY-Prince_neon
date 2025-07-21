module.exports = (client) => {
  const GUILD_ID = '1313726364834070538'; // Your Guild ID
  const CHANNEL_ID = '1329091820650758207'; // Your Channel ID
  const PING_USER_ID = '1193914675021238283'; // Replace with your User ID to ping

  // Function to send a message to the error log channel
  const sendMessageToChannel = async (message, ping = false) => {
    try {
      const guild = await client.guilds.fetch(GUILD_ID);
      const channel = guild?.channels.cache.get(CHANNEL_ID);

      if (channel) {
        const content = ping ? `<@${PING_USER_ID}> ${message}` : message;
        await channel.send(content);
        console.log('Message sent to the error log channel.');
      } else {
        console.error(`Channel with ID ${CHANNEL_ID} not found.`);
      }
    } catch (error) {
      console.error('Error while sending message to the channel:', error.stack || error.message);
    }
  };

  // Notify on bot startup
  client.on('ready', async () => {
    console.log('Bot is ready.');
    await sendMessageToChannel(`🔔 **Now I am sharing all error logs in this channel!**`);
  });

  // Handle client errors
  client.on('error', async (err) => {
    console.error('Client Error:', err);
    await sendMessageToChannel(
      `⚠️ **Client Error:**\n\`\`\`js\n${err.stack || err.message || err}\n\`\`\``,
      true
    );
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason) => {
    console.error('Unhandled Rejection:', reason);
    await sendMessageToChannel(
      `⚠️ **Unhandled Rejection:**\n\`\`\`js\n${reason.stack || reason}\n\`\`\``,
      true
    );
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    await sendMessageToChannel(
      `⚠️ **Uncaught Exception:**\n\`\`\`js\n${error.stack || error.message || error}\n\`\`\``,
      true
    );

    // Optional: Exit process after logging
    process.exit(1);
  });
};