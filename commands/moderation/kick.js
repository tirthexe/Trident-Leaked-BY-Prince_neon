const { PermissionsBitField } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "kick",
  description: "Kick a user from the server.",
  aliases: ["bhak"], 
  async execute(client, message, args) {
    const executor = message.author;
    const reason = args.slice(1).join(" ") || "No reason provided";

    // Check if the user has kick permissions
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You don't have permission to kick members.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if the bot has kick permissions
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | I don't have permission to kick members.`,
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
            `${emoji.error} | Please mention a valid user or provide a valid user ID to kick.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Ensure a valid mention or ID is provided (ignore replies)
    if (message.reference) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | Please mention a valid user or provide a valid user ID to kick.`,
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
            `${emoji.error} | Please mention a valid user or provide a valid user ID to kick.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if the user is trying to kick themselves
    if (target.id === executor.id) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You cannot kick yourself.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Owner bypass: Owners can kick anyone
    const isOwner = message.guild.ownerId === executor.id;

    // Role hierarchy check (if not owner)
    if (!isOwner && target.roles?.highest.position >= message.member.roles.highest.position) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You don't have permission to kick this user.`,
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
            `${emoji.error} | I cannot kick this user because their role is higher than mine.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Attempt to kick the user
    try {
      // Ensure executor is defined and set the tag safely
      const executorTag = executor ? executor.tag : "Unknown";

      // DM the user before kicking
      try {
        await target.send({
          embeds: [
            createEmbed(
              "#FF0000",
              `You have been kicked from **${message.guild.name}**.\n**Reason:** ${reason}\n**Kicked by:** ${executorTag}`,
              executor,
              client,
              null
            ),
          ],
        });
      } catch (dmError) {
        console.error(`Failed to DM the user: ${dmError.message}`);
      }

      // Kick the user
      await target.kick(`User kicked by ${executorTag} | ${reason}`);

      // Reply with success
      return message.reply({
        embeds: [
          createEmbed(
            "#00FF00",
            `${emoji.tick} | Successfully kicked <@${target.id}> from the server.`,
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
            `${emoji.error} | There was an error trying to kick this user.`,
            executor,
            client,
            null
          ),
        ],
      });
    }
  },
};