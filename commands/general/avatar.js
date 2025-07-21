const { createEmbed } = require("../../embed"); // Import your embed handler

module.exports = {
  name: "avatar", // Command name
  aliases: ["av"], // Aliases
  description: "Fetch the avatar of yourself or a mentioned user.",
  async execute(client, message, args) {
    try {
      // Determine the target user (mentioned user or the author of the message)
      const targetUser = message.mentions.users.first() || message.author;

      // Fetch the avatar URL
      const avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });

      // Create an embed for the avatar
      const embed = createEmbed(
        "#fffa00", // Color of the embed
        `Here is the avatar for **${targetUser.tag}**`, // Description
        message.author, // User who triggered the command
        client, // Discord client
        null,  // Thumbnail option
        avatarURL // Full-sized avatar as the embed image
      );

      // Send the embed
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in avatar command:", error);
      message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            "Processing your request... Please wait a moment.",
            message.author,
            client,
            "bot"
          ),
        ],
      });
    }
  },
};