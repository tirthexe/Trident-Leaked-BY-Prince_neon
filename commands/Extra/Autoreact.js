const AutoReact = require("../../database/AutoReact");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "autoreact",
  aliases: ["arx"],
  description: "Configure autoreact settings",
  async execute(client, message, args) {
    const sub = args[0];
    const guildId = message.guild.id;

    let data = await AutoReact.findOne({ guildId });
    if (!data) data = await AutoReact.create({ guildId, reacts: [] });

    if (!sub) {
      return message.reply({
        embeds: [createEmbed("#FF0000", `${emoji.error} | Please use subcommand: \`add <name> <emoji>\`, \`remove <name>\`, or \`list\`.`, message.author, client)]
      });
    }

    if (sub === "add") {
      const name = args[1];
      const rawEmoji = args[2];

      if (!name || !rawEmoji) {
        return message.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | Usage: \`autoreact add <name> <emoji>\``, message.author, client)]
        });
      }

      if (data.reacts.find(r => r.name.toLowerCase() === name.toLowerCase())) {
        return message.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | Reaction already set with this name.`, message.author, client)]
        });
      }

      const isCustomEmoji = /^<a?:\w+:\d+>$/.test(rawEmoji);
      const isUnicodeEmoji = /^[\p{Emoji}\u200d\u20e3]+$/u.test(rawEmoji);

      if (isCustomEmoji) {
        const emojiId = rawEmoji.match(/\d+/)[0];
        const guildEmoji = client.emojis.cache.get(emojiId);

        if (!guildEmoji) {
          return message.reply({
            embeds: [createEmbed("#FF0000", `${emoji.error} | I don't have access to that custom emoji.`, message.author, client)]
          });
        }
      } else if (!isUnicodeEmoji) {
        return message.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | That doesn't look like a valid emoji.`, message.author, client)]
        });
      }

      data.reacts.push({ name, emoji: rawEmoji });
      await data.save();

      return message.reply({
        embeds: [createEmbed("#00FF00", `${emoji.tick} | Successfully added autoreact for \`${name}\` → ${rawEmoji}`, message.author, client)]
      });
    }

    if (sub === "remove") {
      const name = args[1];
      if (!name) {
        return message.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | Usage: \`autoreact remove <name>\``, message.author, client)]
        });
      }

      const index = data.reacts.findIndex(r => r.name.toLowerCase() === name.toLowerCase());
      if (index === -1) {
        return message.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | No autoreact found with name \`${name}\`.`, message.author, client)]
        });
      }

      data.reacts.splice(index, 1);
      await data.save();

      return message.reply({
        embeds: [createEmbed("#00FF00", `${emoji.tick} | Removed autoreact \`${name}\`.`, message.author, client)]
      });
    }

    if (sub === "list") {
      if (!data.reacts.length) {
        return message.reply({
          embeds: [createEmbed("#FFA500", "No autoreacts set for this server.", message.author, client)]
        });
      }

      const list = data.reacts.map((r, i) => `[${i + 1}] \`${r.name}\` → ${r.emoji}`).join("\n");

      return message.reply({
        embeds: [createEmbed("#00BFFF", `**AutoReacts in this server:**\n\n${list}`, message.author, client)]
      });
    }

    return message.reply({
      embeds: [createEmbed("#FF0000", `${emoji.error} | Invalid subcommand. Use \`add\`, \`remove\`, or \`list\`.`, message.author, client)]
    });
  }
};