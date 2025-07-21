const { PermissionsBitField } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "unmute",
  description: "Unmute a user in the server.",
  async execute(client, message, args) {
    const executor = message.author;
    const reason = args.slice(1).join(" ") || "No reason provided";

    // Check if the user has mute permissions
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You don't have permission to unmute members.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if the bot has mute permissions
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | I don't have permission to unmute members.`,
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
            `${emoji.error} | Please mention a valid user to unmute.`,
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
            `${emoji.error} | Please mention a valid user to unmute.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if the user is trying to unmute themselves
    if (target.id === executor.id) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You cannot unmute yourself.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if the target user has admin permissions
    if (target.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | This user is an admin, I can't unmute them.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Owner bypass: Owners can unmute anyone
    const isOwner = message.guild.ownerId === executor.id;

    // Role hierarchy check (if not owner)
    if (!isOwner && target.roles?.highest.position >= message.member.roles.highest.position) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You don't have permission to unmute this user.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Role hierarchy check for the bot
    if (
      target.roles?.highest &&
      target.roles.highest.position >= message.guild.members.me.roles.highest.position
    ) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | I cannot unmute this user because their role is higher than mine.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if the user is muted
    if (!target.isCommunicationDisabled()) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | This user is not muted.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Attempt to unmute the user
    try {
      // Unmute the user using timeout
      await target.timeout(null, `Unmuted by ${executor.tag} | ${reason}`);

      // Reply with success
      return message.reply({
        embeds: [
          createEmbed(
            "#00FF00",
            `${emoji.tick} | Successfully unmuted <@${target.id}>.`,
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
            `${emoji.error} | There was an error trying to unmute this user.`,
            executor,
            client,
            null
          ),
        ],
      });
    }
  },
};