const { PermissionsBitField } = require("discord.js");
const axios = require("axios");
const emoji = require("../../emoji.js");

module.exports = {
  name: "stealall",
  description: "Steal all emojis from a message.",
  async execute(client, message, args) {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.ManageEmojisAndStickers
      )
    ) {
      return message.reply(
        `${emoji.cancel} **You don't have permission to manage emojis or stickers.**`
      );
    }

    const targetMessage = message.reference
      ? await message.channel.messages.fetch(message.reference.messageId)
      : null;

    if (!targetMessage) {
      return message.reply(
        `${emoji.cancel} **Please reply to a message containing emojis to steal.**`
      );
    }

    const emojiRegex = /<a?:\w+:(\d+)>/g;
    const emojis = targetMessage.content.match(emojiRegex) || [];

    if (emojis.length === 0) {
      return message.reply(`${emoji.cancel} **No emojis found to steal.**`);
    }

    // Inform the user about the processing
    const processingMessage = await message.reply(
      `Please wait, processing ${emoji.loading}...`
    );

    const addedEmojis = [];
    for (const rawEmoji of emojis) {
      const emojiId = rawEmoji.match(/\d+/)[0];
      const extension = rawEmoji.startsWith("<a:") ? "gif" : "png";
      const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;

      try {
        const response = await axios.get(emojiUrl, { responseType: "arraybuffer" });
        const emojiName = `emoji_${Date.now()}`;

        const newEmoji = await message.guild.emojis.create({
          attachment: Buffer.from(response.data),
          name: emojiName,
        });

        addedEmojis.push(newEmoji.toString());
      } catch (err) {
        console.error(err);
      }
    }

    // Delete the processing message
    await processingMessage.delete();

    if (addedEmojis.length === 0) {
      return message.reply(`${emoji.cancel} **Failed to steal emojis.**`);
    }

    // Reply with a success message and list the added emojis
    message.reply(
      `✅ **Successfully added the following emojis:** ${addedEmojis.join(" ")}`
    );
  },
};