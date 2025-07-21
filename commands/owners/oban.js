const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");
const { ownerID } = require("../../owner");

module.exports = {
  name: "oban",
  description: "Forcefully bans a user from the guild (Owner only).",
  async execute(client, message, args) {
    try {
      // Check if the user is the bot owner
      if (message.author.id !== ownerID) return;

      // Validate arguments
      if (args.length < 1) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} Please mention a user or provide their ID to ban.`,
              message.author,
              client,
              null
            ),
          ],
        });
      }

      // Get the user to ban (mention or ID)
      const user =
        message.mentions.members.first() ||
        (await message.guild.members.fetch(args[0]).catch(() => null));

      if (!user) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} Unable to find the user in this guild.`,
              message.author,
              client,
              null
            ),
          ],
        });
      }

      // Ban the user
      await message.guild.members.ban(user.id, {
        reason: `Forcefully banned by ${message.author.tag}`,
      });

      // Send confirmation embed
      return message.reply({
        embeds: [
          createEmbed(
            "#00FF00",
            `${emoji.tick} Successfully banned **${user.user.tag}** from the guild.`,
            message.author,
            client,
            null
          ),
        ],
      });
    } catch (error) {
      console.error("Error in oban command:", error);

      // Send error message only for unexpected issues
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} An error occurred while trying to ban the user.`,
            message.author,
            client,
            null
          ),
        ],
      });
    }
  },
};