const { PermissionsBitField } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "snipe",
  description: "Retrieve the last deleted message in this channel.",
  async execute(client, message) {
    const executor = message.author;

    // Check permissions
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You don't have permission to **snipe** messages.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if deleted message exists in this channel
    const snipes = client.snipedMessages?.[message.channel.id];
    if (!snipes || snipes.length === 0) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | No deleted messages found in this channel.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    const { content, author, timestamp } = snipes[0];

    return message.reply({
      embeds: [
        createEmbed(
          "#FFFF00",
          `**Content**\n${content}\n\n**Author**: ${author}\n**Time**: <t:${Math.floor(timestamp / 1000)}:f>`,
          executor,
          client,
          null
        ),
      ],
    });
  },
};