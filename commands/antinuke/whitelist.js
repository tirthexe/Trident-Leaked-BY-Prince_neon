const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require("discord.js");
const AntiNukeAndWhitelist = require("../../database/Antinuke");
const emoji = require("../../emoji.js");

module.exports = {
  name: "whitelist",
  description: "Whitelist a user for specific AntiNuke actions.",
  aliases: ["wl"],
  async execute(client, message, args) {
    const executor = message.author;

    let guildSettings = await AntiNukeAndWhitelist.findOne({ guildId: message.guild.id });
    if (!guildSettings) return message.channel.send(`${emoji.cross} | AntiNuke settings not found for this server.`);
    if (!guildSettings.enabled) return message.channel.send(`${emoji.error} | Please enable AntiNuke first. Current status: **AntiNuke is disabled**.`);
    if (message.guild.ownerId !== executor.id && !guildSettings.extraOwners.includes(executor.id)) {
      return message.channel.send(`${emoji.cross} | **Take OWNERSHIP first then come to me, ok.**`);
    }

    const userToWhitelist = message.mentions.users.first();
    if (!userToWhitelist) return message.channel.send(`${emoji.cross} | Please mention a user to whitelist.`);

    let userEntry = guildSettings.users.find((u) => u.userId === userToWhitelist.id);
    if (!userEntry) {
      userEntry = {
        userId: userToWhitelist.id,
        actions: {
          create_channel: false,
          delete_channel: false,
          update_channel: false,
          create_role: false,
          delete_role: false,
          update_role: false,
          member_role_update: false,
          ban: false,
          kick: false,
          create_emoji: false,
          update_emoji: false,
          delete_emoji: false,
          mention: false,
          webhook: false,
          guild_update: false,
          bot_add: false,
          create_event: false,
          delete_event: false,
          update_event: false,
          create_automod: false,
          update_automod: false,
          delete_automod: false,
          antipurne: false,
        },
      };
      guildSettings.users.push(userEntry);
      await AntiNukeAndWhitelist.updateOne({ guildId: message.guild.id }, { $set: { users: guildSettings.users } });
      guildSettings = await AntiNukeAndWhitelist.findOne({ guildId: message.guild.id });
      userEntry = guildSettings.users.find((u) => u.userId === userToWhitelist.id);
    }

    const options = [
      { label: "All Actions (Select All)", value: "all" },
      { label: "Channel Create", value: "create_channel" },
      { label: "Channel Delete", value: "delete_channel" },
      { label: "Channel Update", value: "update_channel" },
      { label: "Role Create", value: "create_role" },
      { label: "Role Delete", value: "delete_role" },
      { label: "Role Update", value: "update_role" },
      { label: "Member Role Update", value: "member_role_update" },
      { label: "Ban", value: "ban" },
      { label: "Kick", value: "kick" },
      { label: "Emoji Create", value: "create_emoji" },
      { label: "Emoji Update", value: "update_emoji" },
      { label: "Emoji Delete", value: "delete_emoji" },
      { label: "Mention (Everyone/Here)", value: "mention" },
      { label: "Webhook", value: "webhook" },
      { label: "Guild Update", value: "guild_update" },
      { label: "Bot Add", value: "bot_add" },
      { label: "Event Create", value: "create_event" },
      { label: "Event Delete", value: "delete_event" },
      { label: "Event Update", value: "update_event" },
      { label: "Automod Create", value: "create_automod" },
      { label: "Automod Update", value: "update_automod" },
      { label: "Automod Delete", value: "delete_automod" },
      { label: "AntiPurne", value: "antipurne" },
    ];

    const getWhitelistStatus = () =>
      options
        .filter((opt) => opt.value !== "all")
        .map((opt) => `> ${userEntry.actions[opt.value] ? emoji.on : emoji.off} ${opt.label}`)
        .join("\n");

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("whitelist_select")
        .setPlaceholder("Select actions to whitelist")
        .setMinValues(1)
        .setMaxValues(options.length)
        .addOptions(options)
    );

    const sentMessage = await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle(`Whitelist Status for ${userToWhitelist.tag}`)
          .setDescription(`Here are the current whitelist statuses for ${userToWhitelist}:\n\n**${getWhitelistStatus()}**`)
          .setThumbnail(client.user.displayAvatarURL())
          .setFooter({ text: "TRIDENT ❤ DEVELOPMENT.", iconURL: client.user.displayAvatarURL() })
          .setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() }),
      ],
      components: [row],
    });

    const filter = (interaction) => interaction.user.id === executor.id;
    const collector = sentMessage.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on("collect", async (interaction) => {
      if (interaction.isStringSelectMenu()) {
        const selectedValues = interaction.values;
        const actionsToWhitelist = selectedValues.includes("all")
          ? options.map((option) => option.value).filter((value) => value !== "all")
          : selectedValues;

        actionsToWhitelist.forEach((action) => {
          userEntry.actions[action] = true;
        });

        if (selectedValues.includes("all")) {
          options.forEach((option) => {
            if (option.value !== "all") userEntry.actions[option.value] = true;
          });
        } else {
          Object.keys(userEntry.actions).forEach((action) => {
            if (!actionsToWhitelist.includes(action)) {
              userEntry.actions[action] = false;
            }
          });
        }

        await AntiNukeAndWhitelist.updateOne({ guildId: message.guild.id }, { $set: { users: guildSettings.users } });

        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor("#ff0000")
              .setTitle(`Updated Whitelist Status for ${userToWhitelist.tag}`)
              .setDescription(`Here are the updated whitelist statuses for ${userToWhitelist}:\n\n**${getWhitelistStatus()}**`)
              .setThumbnail(client.user.displayAvatarURL())
              .setFooter({ text: "TRIDENT ❤ DEVELOPMENT.", iconURL: client.user.displayAvatarURL() })
              .setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() }),
          ],
          components: [row],
        });
      }
    });

    collector.on("end", async () => {
      sentMessage.edit({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle(`Whitelist Status for ${userToWhitelist.tag}`)
            .setDescription(`Here is the current whitelist status:\n\n**${getWhitelistStatus()}**`)
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: "TRIDENT ❤ DEVELOPMENT.", iconURL: client.user.displayAvatarURL() })
            .setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() }),
        ],
        components: [],
      }).catch(() => {});
    });
  },
};