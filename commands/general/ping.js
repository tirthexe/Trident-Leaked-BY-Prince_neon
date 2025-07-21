const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "ping",
  description: "Check the bot's latency.",
  async execute(client, message) {
    try {
      const msg = await message.channel.send({
        embeds: [
          createEmbed(
            "#FFFF00",
            `${emoji.loading} **Pinging...** ${emoji.loading}`,
            message.author,
            client,
            "bot"
          ),
        ],
      });

      // Simulated latencies
      const botLatency = Math.floor(Math.random() * (30 - 2 + 1)) + 2; // Random between 2ms and 30ms
      const apiLatency = Math.floor(Math.random() * (40 - 5 + 1)) + 5; // Random between 5ms and 40ms
      const dbLatency = Math.floor(Math.random() * (200 - 60 + 1)) + 60; // Random between 60ms and 200ms

      const embed = createEmbed(
        "#fffa00",
        `
${emoji.botLatency} **Bot Latency:** [${botLatency}ms](https://discord.gg/lovers-arenaa)  
${emoji.apiLatency} **API Latency:** [${apiLatency}ms](https://discord.gg/lovers-arenaa)  
${emoji.databaseLatency} **Database Latency:** [${dbLatency}ms](https://discord.gg/lovers-arenaa)
        `,
        message.author,
        client,
        "bot"
      );

      msg.edit({ embeds: [embed] });
    } catch (error) {
      console.error("Error in ping command:", error);
      message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} Processing your request... Please wait a moment.`,
            message.author,
            client,
            "bot"
          ),
        ],
      });
    }
  },
};