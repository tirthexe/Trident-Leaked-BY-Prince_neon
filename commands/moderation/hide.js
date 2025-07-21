const { PermissionsBitField } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "hide",
  description: "Hide the current channel for everyone.",
  async execute(client, message, args) {
    const executor = message.author;

    // Ensure no arguments are provided
    if (args.length > 0) {
      return;
    }

    // Check if the user has Manage Channels permission
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You don't have permission to hide channels.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if the bot has Manage Channels permission
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | I don't have permission to hide channels.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    const channel = message.channel;
    const reason = `Channel hidden by ${executor.tag}`;

    try {
      // Update channel permissions to hide it for @everyone with an audit log reason
      await channel.permissionOverwrites.edit(
        message.guild.roles.everyone,
        { ViewChannel: false },
        { reason }
      );

      // Reply with success
      return message.reply({
        embeds: [
          createEmbed(
            "#00FF00",
            `${emoji.tick} | <#${channel.id}> Has been hiden for ** everyone**.`,
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
            `${emoji.error} | There was an error trying to hide the channel.`,
            executor,
            client,
            null
          ),
        ],
      });
    }
  },
};