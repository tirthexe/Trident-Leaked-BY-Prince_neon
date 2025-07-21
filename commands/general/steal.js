const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require("discord.js");
const axios = require("axios");
const sharp = require("sharp"); // For resizing images
const emoji = require("../../emoji.js");

module.exports = {
  name: "steal",
  description: "Steal emojis, stickers, or media from a message.",
  async execute(client, message, args) {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.ManageEmojisAndStickers
      )
    ) {
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          `${emoji.cancel} **You don't have permission to manage emojis or stickers.**`
        );
      return message.reply({ embeds: [embed], ephemeral: true });
    }

    const targetMessage = message.reference
      ? await message.channel.messages.fetch(message.reference.messageId)
      : null;

    if (!targetMessage) {
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          `${emoji.cancel} **Please reply to a message containing emojis, stickers, or media to steal.**`
        );
      return message.reply({ embeds: [embed], ephemeral: true });
    }

    const emojiRegex = /<a?:\w+:(\d+)>/g;
    const emojis = targetMessage.content.match(emojiRegex) || [];
    const stickers = targetMessage.stickers.map((sticker) => sticker);
    const attachments = targetMessage.attachments.map((attachment) => attachment.url);

    if (emojis.length === 0 && stickers.length === 0 && attachments.length === 0) {
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          `${emoji.cancel} **No emojis, stickers, or media found in the message to steal.**`
        );
      return message.reply({ embeds: [embed], ephemeral: true });
    }

    let currentIndex = 0;

    const createEmbed = () => {
      const totalItems = emojis.length + stickers.length + attachments.length;
      const isEmoji = currentIndex < emojis.length;
      const isSticker = currentIndex >= emojis.length && currentIndex < emojis.length + stickers.length;
      const isAttachment = currentIndex >= emojis.length + stickers.length;

      let description, imageUrl;

      if (isEmoji) {
        const emojiId = emojis[currentIndex].match(/\d+/)[0];
        const extension = emojis[currentIndex].startsWith("<a:") ? "gif" : "png";
        description = `Emoji: ${emojis[currentIndex]}`;
        imageUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;
      } else if (isSticker) {
        const sticker = stickers[currentIndex - emojis.length];
        description = `Sticker: ${sticker.name}`;
        imageUrl = sticker.url;
      } else {
        const attachment = attachments[currentIndex - emojis.length - stickers.length];
        description = `Attachment: Media File`;
        imageUrl = attachment;
      }

      return new EmbedBuilder()
        .setColor("Green")
        .setTitle("Steal Manager")
        .setDescription(description)
        .setImage(imageUrl)
        .setFooter({ text: `Item ${currentIndex + 1} of ${totalItems}` });
    };

    const navigationButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("previous")
        .setEmoji(emoji.previous)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("cancel")
        .setEmoji(emoji.cancel)
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("next")
        .setEmoji(emoji.next)
        .setStyle(ButtonStyle.Primary)
    );

    const actionButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("steal_emoji")
        .setLabel("As Emoji")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("steal_sticker")
        .setLabel("As Sticker")
        .setStyle(ButtonStyle.Success)
    );

    const msg = await message.reply({
      embeds: [createEmbed()],
      components: [navigationButtons, actionButtons],
    });

    const collector = msg.createMessageComponentCollector({
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(`${emoji.cancel} **You cannot interact with this menu.**`),
          ],
          ephemeral: true,
        });
      }

      switch (interaction.customId) {
        case "previous":
          currentIndex =
            (currentIndex - 1 + emojis.length + stickers.length + attachments.length) %
            (emojis.length + stickers.length + attachments.length);
          await interaction.update({ embeds: [createEmbed()] });
          break;

        case "next":
          currentIndex =
            (currentIndex + 1) %
            (emojis.length + stickers.length + attachments.length);
          await interaction.update({ embeds: [createEmbed()] });
          break;

        case "cancel":
          collector.stop();
          await interaction.update({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${emoji.cancel} **Steal process cancelled.**`),
            ],
            components: [],
          });
          break;

        case "steal_emoji":
        case "steal_sticker":
          const url = (() => {
            if (currentIndex < emojis.length) {
              const emojiId = emojis[currentIndex].match(/\d+/)[0];
              const extension = emojis[currentIndex].startsWith("<a:") ? "gif" : "png";
              return `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;
            } else if (
              currentIndex >= emojis.length &&
              currentIndex < emojis.length + stickers.length
            ) {
              return stickers[currentIndex - emojis.length].url;
            } else {
              return attachments[currentIndex - emojis.length - stickers.length];
            }
          })();

          try {
            const response = await axios.get(url, { responseType: "arraybuffer" });
            let fileBuffer = Buffer.from(response.data);

            if (interaction.customId === "steal_sticker") {
              // Resize image to 512x512 px for stickers
              fileBuffer = await sharp(fileBuffer)
                .resize(512, 512)
                .toBuffer();

              const newSticker = await message.guild.stickers.create({
                file: fileBuffer,
                name: `sticker_${currentIndex + 1}`,
              });
              await interaction.reply({
                embeds: [
                  new EmbedBuilder()
                    .setColor("Green")
                    .setDescription(`${emoji.tick} | **Sticker added:** ${newSticker.name}`),
                ],
                ephemeral: true,
              });
            } else {
              const newEmoji = await message.guild.emojis.create({
                attachment: fileBuffer,
                name: `emoji_${currentIndex + 1}`,
              });
              await interaction.reply({
                embeds: [
                  new EmbedBuilder()
                    .setColor("Green")
                    .setDescription(`${emoji.tick} | **Emoji added:** ${newEmoji}`),
                ],
                ephemeral: true,
              });
            }
          } catch (err) {
            console.error(err);
            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor("Red")
                  .setDescription(`${emoji.cancel} **Failed to steal the item.**`),
              ],
              ephemeral: true,
            });
          }
          break;

        default:
          break;
      }
    });

    collector.on("end", () => {
      msg.edit({ components: [] });
    });
  },
};