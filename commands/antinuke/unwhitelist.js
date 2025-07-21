const { PermissionsBitField } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");
const AntiNuke = require("../../database/Antinuke");

module.exports = {
  name: "unwhitelist",
  description: "Remove a user from the whitelist and reset all permissions.",
  aliases: ["uwl"], 
  async execute(client, message, args) {
    const executor = message.author;

    // Fetch guild settings to check for extra owners
    const guildSettings = await AntiNuke.findOne({ guildId: message.guild.id });
    if (!guildSettings) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | AntiNuke settings not found for this server.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if the executor is the guild owner or an extra owner
    if (
      message.guild.ownerId !== executor.id &&
      !guildSettings.extraOwners.includes(executor.id)
    ) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | Take **ownership** first then come to me.`,
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
            `${emoji.error} | Please mention a valid user or provide a valid user ID to unwhitelist.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    const target =
      message.mentions.members.first() ||
      (await message.guild.members.fetch(args[0]).catch(() => null));

    if (!target) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | Please mention a valid user or provide a valid user ID to unwhitelist.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    try {
      const guildId = message.guild.id;

      // Fetch and update the whitelist
      if (!guildSettings.enabled) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | Anti-nuke is not enabled for this server.`,
              executor,
              client,
              null
            ),
          ],
        });
      }

      const userIndex = guildSettings.users.findIndex(
        (user) => user.userId === target.id
      );

      if (userIndex === -1) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | This user is not whitelisted.`,
              executor,
              client,
              null
            ),
          ],
        });
      }

      // Remove the user from the whitelist
      guildSettings.users.splice(userIndex, 1);
      await guildSettings.save();

      return message.reply({
        embeds: [
          createEmbed(
            "#00FF00",
            `${emoji.tick} | Successfully removed <@${target.id}> from the whitelist and reset their permissions.`,
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
            `${emoji.error} There was an error trying to unwhitelist this user.`,
            executor,
            client,
            null
          ),
        ],
      });
    }
  },
};