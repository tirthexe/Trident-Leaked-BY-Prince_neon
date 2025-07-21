const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const AutoReact = require("../../database/AutoReact");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoreact')
    .setDescription('Configure autoreact settings')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a new autoreact')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('The name of the autoreact')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('emoji')
            .setDescription('The emoji to react with')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove an existing autoreact')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('The name of the autoreact to remove')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all autoreacts in the server')
    ),

  async execute(interaction, client) {
    // Admin check
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription(`${emoji.error} | You don't have enough permissions to use this command.`)
        ],
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    let data = await AutoReact.findOne({ guildId });
    if (!data) data = await AutoReact.create({ guildId, reacts: [] });

    if (sub === 'add') {
      const name = interaction.options.getString('name');
      const rawEmoji = interaction.options.getString('emoji');

      // Check if the autoreact already exists
      if (data.reacts.find(r => r.name.toLowerCase() === name.toLowerCase())) {
        return interaction.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | Reaction already set with this name.`, interaction.user, client)]
        });
      }

      // Emoji validation
      const isCustomEmoji = /^<a?:\w+:\d+>$/.test(rawEmoji);
      const isUnicodeEmoji = /^[\p{Emoji}\u200d\u20e3]+$/u.test(rawEmoji);

      if (isCustomEmoji) {
        const emojiId = rawEmoji.match(/\d+/)[0];
        const guildEmoji = client.emojis.cache.get(emojiId);

        if (!guildEmoji) {
          return interaction.reply({
            embeds: [createEmbed("#FF0000", `${emoji.error} | I don't have access to that custom emoji.`, interaction.user, client)]
          });
        }
      } else if (!isUnicodeEmoji) {
        return interaction.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | That doesn't look like a valid emoji.`, interaction.user, client)]
        });
      }

      // Add the new autoreact
      data.reacts.push({ name, emoji: rawEmoji });
      await data.save();

      return interaction.reply({
        embeds: [createEmbed("#00FF00", `${emoji.tick} | Successfully added autoreact for \`${name}\` → ${rawEmoji}`, interaction.user, client)]
      });
    }

    if (sub === 'remove') {
      const name = interaction.options.getString('name');
      const index = data.reacts.findIndex(r => r.name.toLowerCase() === name.toLowerCase());

      if (index === -1) {
        return interaction.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | No autoreact found with name \`${name}\`.`, interaction.user, client)]
        });
      }

      // Remove the autoreact
      data.reacts.splice(index, 1);
      await data.save();

      return interaction.reply({
        embeds: [createEmbed("#00FF00", `${emoji.tick} | Removed autoreact \`${name}\`.`, interaction.user, client)]
      });
    }

    if (sub === 'list') {
      if (!data.reacts.length) {
        return interaction.reply({
          embeds: [createEmbed("#FFA500", "No autoreacts set for this server.", interaction.user, client)]
        });
      }

      const list = data.reacts.map((r, i) => `[${i + 1}] \`${r.name}\` → ${r.emoji}`).join("\n");

      return interaction.reply({
        embeds: [createEmbed("#00BFFF", `**AutoReacts in this server:**\n\n${list}`, interaction.user, client)]
      });
    }
  }
};