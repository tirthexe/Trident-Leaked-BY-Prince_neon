const { PermissionsBitField } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");
const PrefixDB = require("../../database/prefix");

module.exports = {
  name: "prefix",
  description: "Set, reset or check the server's command prefix.",
  aliases: ["setprefix"],
  async execute(client, message, args) {
    const executor = message.author;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | Only administrators can manage the server prefix.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    const currentData = await PrefixDB.findOne({ guildId: message.guild.id });
    const currentPrefix = currentData?.prefix || null;

    // If no arguments, show info
    if (!args[0]) {
      return message.reply({
        embeds: [
          createEmbed(
            "#0099FF",
            currentPrefix
              ? `${emoji.anvi} | The current prefix is: \`${currentPrefix}\``
              : `${emoji.anvi} | No custom prefix is set.`,
            executor,
            client,
            currentPrefix
              ? `To remove, type: prefix none\nTo replace, type: prefix <new prefix>`
              : `To set, type: prefix <new prefix>`
          ),
        ],
      });
    }

    const arg = args[0].toLowerCase();

    if (arg === "none") {
      if (!currentPrefix) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | No custom prefix is set for this server.`,
              executor,
              client,
              null
            ),
          ],
        });
      }

      await PrefixDB.findOneAndDelete({ guildId: message.guild.id });

      return message.reply({
        embeds: [
          createEmbed(
            "#00FF00",
            `${emoji.tick} | Prefix has been reset to default.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    if (arg.length < 1 || arg.length > 4) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | Prefix must be between 1 and 4 characters.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    if (currentPrefix && currentPrefix === arg) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | This prefix is already set.`,
            executor,
            client,
            `To remove, type: prefix none\nTo replace, type: prefix <new prefix>`
          ),
        ],
      });
    }

    await PrefixDB.findOneAndUpdate(
      { guildId: message.guild.id },
      { prefix: arg },
      { upsert: true }
    );

    return message.reply({
      embeds: [
        createEmbed(
          "#00FF00",
          currentPrefix
            ? `${emoji.tick} | Prefix updated from \`${currentPrefix}\` to \`${arg}\`.`
            : `${emoji.tick} | Prefix set to \`${arg}\`.`,
          executor,
          client,
          null
        ),
      ],
    });
  },
};