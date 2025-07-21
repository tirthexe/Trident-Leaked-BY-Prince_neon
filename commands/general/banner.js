const { createEmbed } = require("../../embed"); // Import your embed handler
const emoji = require("../../emoji"); // Import your emoji file

module.exports = {
  name: "banner", // Command name
  aliases: ["bn"], // Aliases
  description: "Fetch the banner of yourself or a mentioned user (if available).",
  async execute(client, message, args) {
    try {
      // Determine the target user (mentioned user or the author of the message)
      const targetUser = message.mentions.users.first() || message.author;

      // Fetch the user's banner
      const user = await client.users.fetch(targetUser.id, { force: true });

      // Check if the user has a banner
      if (!user.banner) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} **${targetUser.tag}** does not have a banner.`,
              message.author,
              client,
              "user"
            ),
          ],
        });
      }

      // Get the banner URL
      const bannerURL = user.bannerURL({ dynamic: true, size: 1024 });

      // Create an embed for the banner
      const embed = createEmbed(
        "#fffa00", // Color of the embed
        `Here is the banner for **${targetUser.tag}**`, // Description
        message.author, // User who triggered the command
        client, // Discord client
        null, // Thumbnail option
        bannerURL // Full-sized banner as the embed image
      );

      // Send the embed
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in banner command:", error);
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