const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createEmbed } = require("../../embed"); // Import your embed handler
const emoji = require("../../emoji"); // Import emojis if required

module.exports = {
  name: "invite", // Command name
  aliases: ["inv"], // Aliases
  description: "Provides bot invite link and support server link.",
  async execute(client, message, args) {
    try {
      // Links
      const botInvite = "https://discord.com/oauth2/authorize?client_id=1327936936203124789&permissions=8&integration_type=0&scope=bot"; // Replace with your bot's invite link
      const supportServer = "https://discord.gg/lovers-arenaa";

      // Create embed using your handler
      const embed = createEmbed(
        "#fffa00", // Color of the embed
        `**INVITE Bot**\n> [Invite](${botInvite})\n\n**SUPPORT SERVER**\n> [Join](${supportServer})`, // Description
        message.author, // User who triggered the command
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
      await message.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error("Error in invite command:", error);
      message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} please wait Processing your request... .`,
            message.author,
            client,
            "bot"
          ),
        ],
      });
    }
  },
};