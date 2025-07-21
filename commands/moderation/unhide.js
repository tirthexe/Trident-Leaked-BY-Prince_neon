const { PermissionsBitField } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "unhide",
  description: "Unhide the current channel for everyone.",
  async execute(client, message, args) {
    const executor = message.author;

    // Silently ignore if any arguments are provided
    if (args.length > 0) {
      return;
    }

    // Check if the user has Manage Channels permission
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You don't have permission to unhide channels.`,
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
            `${emoji.error} | I don't have permission to unhide channels.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    const channel = message.channel;
    const reason = `Channel unhidden by ${executor.tag}`;

    try {
      // Update channel permissions to unhide it for @everyone with an audit log reason
      await channel.permissionOverwrites.edit(
        message.guild.roles.everyone,
        { ViewChannel: true },
        { reason }
      );

      // Reply with success
      return message.reply({
        embeds: [
          createEmbed(
            "#00FF00",
            `${emoji.tick} | Successfully unhid the channel <#${channel.id}> for everyone.`,
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
            `${emoji.error} | There was an error trying to unhide the channel.`,
            executor,
            client,
            null
          ),
        ],
      });
    }
  },
};