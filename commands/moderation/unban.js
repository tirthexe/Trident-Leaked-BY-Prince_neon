const { PermissionsBitField } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "unban",
  description: "Unban a user from the server.",
  async execute(client, message, args) {
    const executor = message.author;

    // Check if the user has unban permissions
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You don't have permission to unban members.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if the bot has unban permissions
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | I don't have permission to unban members.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Ensure arguments are provided
    if (!args[0]) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | Please provide a valid user ID to unban.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    const userId = args[0];

    // Attempt to unban the user
    try {
      // Fetch the ban list and check if the user is banned
      const banList = await message.guild.bans.fetch();
      const bannedUser = banList.get(userId);

      if (!bannedUser) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | This user is not banned.`,
              executor,
              client,
              null
            ),
          ],
        });
      }

      // Unban the user
      await message.guild.members.unban(userId, `User unbanned by ${executor.tag}`);

      // Reply with success
      return message.reply({
        embeds: [
          createEmbed(
            "#00FF00",
            `${emoji.tick} | Successfully unbanned <@${userId}> from the server.`,
            executor,
            client,
            null
          ),
        ],
      });
    } catch (error) {
      console.error(error);
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | There was an error trying to unban this user.`,
            executor,
            client,
            null
          ),
        ],
      });
    }
  },
};