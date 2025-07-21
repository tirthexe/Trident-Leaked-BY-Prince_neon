const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createEmbed } = require("../../embed"); // Import your embed handler
const emoji = require("../../emoji"); // Import emojis if required

module.exports = {
  data: new SlashCommandBuilder()
    .setName("invite") // Command name
    .setDescription("Provides bot invite link and support server link."), // Command description
  async execute(interaction, client) {
    try {
      // Links
      const botInvite = "https://discord.com/oauth2/authorize?client_id=1327936936203124789&permissions=8&integration_type=0&scope=bot"; // Replace with your bot's invite link
      const supportServer = "https://discord.gg/lovers-arenaa";

      // Create embed using your handler
      const embed = createEmbed(
        "#5865F2", // Color of the embed
        `**INVITE Bot**\n> [Invite](${botInvite})\n\n**SUPPORT SERVER**\n> [Join](${supportServer})`, // Description
        interaction.user, // User who triggered the command
        client, // Discord client
        "bot" // Thumbnail option: Bot's avatar
      );

      // Buttons
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Invite Bot")
          .setStyle(ButtonStyle.Link)
          .setURL(botInvite), // Bot invite link
        new ButtonBuilder()
          .setLabel("Support Server")
          .setStyle(ButtonStyle.Link)
          .setURL(supportServer) // Support server link
      );

      // Send the embed and buttons
      await interaction.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error("Error in invite slash command:", error);
      await interaction.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} An error occurred while fetching the invite details.`,
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