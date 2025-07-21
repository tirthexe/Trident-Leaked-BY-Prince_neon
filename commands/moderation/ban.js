const { PermissionsBitField } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "ban",
  description: "Ban a user from the server.",
  aliases: ["nikal", "jnl"], 
  async execute(client, message, args) {
    const executor = message.author;
    const reason = args.slice(1).join(" ") || "No reason provided";

    // Check if the user has ban permissions
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You don't have permission to ban members.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if the bot has ban permissions
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | I don't have permission to ban members.`,
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
            `${emoji.error} | Please mention a valid userFUCK or provide a valid user ID to ban.`,
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
            `${emoji.error} | Please mention a valid user or provide a valid user ID to ban.`,
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
            `${emoji.error} | Please mention a valid user or provide a valid user ID to ban.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if the user is trying to ban themselves
    if (target.id === executor.id) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You cannot ban yourself.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Owner bypass: Owners can ban anyone
    const isOwner = message.guild.ownerId === executor.id;

    // Role hierarchy check (if not owner)
    if (!isOwner && target.roles?.highest.position >= message.member.roles.highest.position) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You don't have permission to ban this user.`,
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
            `${emoji.error} | I cannot ban this user because their role is higher than mine.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Attempt to ban the user
    try {
      // Ensure executor is defined and set the tag safely
      const executorTag = executor ? executor.tag : "Unknown";

      // DM the user before banning
      try {
        await target.send({
          embeds: [
            createEmbed(
              "#FF0000",
              `You have been banned from **${message.guild.name}**.\n**Reason:** ${reason}\n**Banned by:** ${executorTag}`,
              executor,
              client,
              null
            ),
          ],
        });
      } catch (dmError) {
        console.error(`Failed to DM the user: ${dmError.message}`);
      }

      // Ban the user
      await message.guild.members.ban(target.id, {
        reason: `User banned by ${executorTag} | ${reason}`,
      });

      // Reply with success
      return message.reply({
        embeds: [
          createEmbed(
            "#00FF00",
            `${emoji.tick} | Successfully banned <@${target.id}> from the server.`,
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
            `${emoji.error} | There was an error trying to ban this user.`,
            executor,
            client,
            null
          ),
        ],
      });
    }
  },
};