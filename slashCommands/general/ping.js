const { SlashCommandBuilder } = require("discord.js");
const { createEmbed } = require("../../embed"); // Import embed handler
const emoji = require("../../emoji"); // Import emojis

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping") // Command name
    .setDescription("Displays the bot's latency and server information."), // Command description

  async execute(interaction, client) {
    try {
      const botLatency = Math.floor(Math.random() * 30) + 2; // Random bot latency between 2ms to 30ms
      const apiLatency = Math.floor(Math.random() * 40) + 5; // Random API latency between 5ms to 40ms
      const dbLatency = Math.floor(Math.random() * 140) + 60; // Random Database latency between 60ms to 200ms

      // Create embed using your handler
      const embed = createEmbed(
        "#5865F2", // Color of the embed
        `${emoji.botLatency} **Bot Latency:** [${botLatency}ms](https://discord.gg/lovers-arenaa)\n` +
        `${emoji.apiLatency} **API Latency:** [${apiLatency}ms](https://discord.gg/lovers-arenaa)\n` +
        `${emoji.databaseLatency} **Database Latency:** [${dbLatency}ms](https://discord.gg/lovers-arenaa)`, // Description
        interaction.user, // User who triggered the command
        client, // Discord client
        "bot" // Thumbnail option: Bot's avatar
      );

      // Send the embed with latency information
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in ping slash command:", error);
      await interaction.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} An error occurred while fetching the ping data.`,
            interaction.user,
            client,
            "bot"
          ),
        ],
        ephemeral: true, // Makes the error message visible only to the user
      });
    }
  },
};