const { ownerID, developerIDs } = require("../../owner");
const { createEmbed } = require("../../embed");
const BadgeDB = require("../../database/badge");
const {
  developer,
  owner,
  management,
  admin,
  mod,
  staff,
  vip,
  supporter,
  voter,
  members
} = require("../../emoji");

const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType
} = require("discord.js");

module.exports = {
  name: "managebadges",
  aliases: ["mb"],
  description: "Manage user badges via dropdown.",
  async execute(client, message, args) {
    if (![ownerID, ...developerIDs].includes(message.author.id)) {
      return message.channel.send({
        embeds: [
          createEmbed(
            0xff0000,
            `❌ You do not have permission to use this command.`,
            message.author,
            client,
            "user",
            null
          )
        ]
      });
    }

    const target = message.mentions.users.first();
    if (!target) {
      return message.channel.send({
        embeds: [
          createEmbed(
            0xff0000,
            `❌ Please mention a user to manage badges.`,
            message.author,
            client,
            "user",
            null
          )
        ]
      });
    }

    let userBadges = await BadgeDB.findOne({ userId: target.id });
    if (!userBadges) {
      userBadges = new BadgeDB({ userId: target.id, badges: [] });
    }

    const badgeOptions = [
      { label: "Developer", value: "developer", emoji: developer },
      { label: "Owner", value: "owner", emoji: owner },
      { label: "Management", value: "management", emoji: management },
      { label: "Admin", value: "admin", emoji: admin },
      { label: "Mod", value: "mod", emoji: mod },
      { label: "Staff", value: "staff", emoji: staff },
      { label: "VIP", value: "vip", emoji: vip },
      { label: "Supporter", value: "supporter", emoji: supporter },
      { label: "Voter", value: "voter", emoji: voter },
      { label: "Members", value: "members", emoji: members }
    ];

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`manage_badges_${target.id}`)
      .setPlaceholder("Select badges to toggle (add/remove)")
      .addOptions(
        badgeOptions.map(b =>
          new StringSelectMenuOptionBuilder()
            .setLabel(b.label)
            .setValue(b.value)
            .setEmoji(b.emoji)
        )
      )
      .setMinValues(1)
      .setMaxValues(badgeOptions.length);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const currentBadgeList = userBadges.badges.length
      ? userBadges.badges.map(b => {
          const found = badgeOptions.find(opt => opt.value === b);
          return found ? `${found.emoji} \`${found.label}\`` : `\`${b}\``;
        }).join(", ")
      : "*No badges assigned*";

    const sent = await message.channel.send({
      embeds: [
        createEmbed(
          0x00bfff,
          `**Badges for ${target.username}:**\n${currentBadgeList}\n\n**Select badges below to add/remove.**`,
          message.author,
          client,
          "user",
          null
        )
      ],
      components: [row]
    });

    const collector = sent.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000,
      filter: i => i.user.id === message.author.id
    });

    collector.on("collect", async interaction => {
      const selected = interaction.values;

      for (const badge of selected) {
        if (userBadges.badges.includes(badge)) {
          userBadges.badges = userBadges.badges.filter(b => b !== badge);
        } else {
          userBadges.badges.push(badge);
        }
      }

      await userBadges.save();

      const updatedBadges = userBadges.badges.length
        ? userBadges.badges.map(b => {
            const found = badgeOptions.find(opt => opt.value === b);
            return found ? `${found.emoji} \`${found.label}\`` : `\`${b}\``;
          }).join(", ")
        : "*No badges assigned*";

      await interaction.update({
        embeds: [
          createEmbed(
            0x00ff99,
            `✅ **Updated badges for ${target.username}:**\n${updatedBadges}`,
            message.author,
            client,
            "user",
            null
          )
        ],
        components: [row]
      });
    });

    collector.on("end", () => {
      sent.edit({ components: [] }).catch(() => {});
    });
  }
};