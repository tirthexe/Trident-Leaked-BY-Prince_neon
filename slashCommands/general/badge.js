const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BadgeDB = require("../../database/badge"); // MongoDB schema for badges
const Bio = require("../../database/bio"); // MongoDB schema for bios
const { developer, owner, management, admin, mod, staff, vip, supporter, voter, members, anvi } = require("../../emoji"); // Emoji mappings

module.exports = {
  data: new SlashCommandBuilder()
    .setName("badge")
    .setDescription("Show badges and bio for a user.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Mention a user to check their badges and bio.")
        .setRequired(false)
    ),
  async execute(interaction, client) {
    const target = interaction.options.getUser("user") || interaction.user;

    // Badge order definition
    const badgeOrder = [
      "anvi", // ANVI badge is always the top
      "developer",
      "owner",
      "management",
      "admin",
      "mod",
      "staff",
      "vip",
      "supporter",
      "voter",
      "members",
    ];

    // Embed creation function
    const createEmbed = ({ color, fields, thumbnailUrl, footerText, footerIconUrl }) => {
      return new EmbedBuilder()
        .setColor(color)
        .addFields(fields)
        .setThumbnail(thumbnailUrl)
        .setFooter({ text: footerText, iconURL: footerIconUrl });
    };

    try {
      let userBadges = await BadgeDB.findOne({ userId: target.id });

      // Ensure user always has the "ANVI" badge if they are the specified user
      if (!userBadges) {
        userBadges = new BadgeDB({ userId: target.id, badges: [] });
      }

      // Only the user with ID "1193914675021238283" should have the "ANVI" badge
      if (target.id === "1193914675021238283") {
        if (!userBadges.badges.includes("anvi")) {
          userBadges.badges.unshift("anvi"); // Add "ANVI" badge to the top
          await userBadges.save();
        }
      } else {
        // Remove "ANVI" badge from other users, if present
        userBadges.badges = userBadges.badges.filter((badge) => badge !== "anvi");
        await userBadges.save();
      }

      // Ensure "members" badge is always included
      if (!userBadges.badges.includes("members")) {
        userBadges.badges.push("members");
        await userBadges.save();
      }

      const badgeEmojis = {
        anvi: anvi,
        developer: developer,
        owner: owner,
        management: management,
        admin: admin,
        mod: mod,
        staff: staff,
        vip: vip,
        supporter: supporter,
        voter: voter,
        members: members,
      };

      const badgeLinks = {
        anvi: "https://discord.com/users/1193914675021238283", // Clickable link for ANVI
      };

      const sortedBadges = badgeOrder.filter((badge) => userBadges.badges.includes(badge));

      const badgeList = sortedBadges
        .map((badge) => {
          if (badge === "anvi") {
            return `${badgeEmojis[badge]} [**ANVI**](${badgeLinks[badge]})`; // Clickable link for ANVI
          }
          return `${badgeEmojis[badge]} **${badge.charAt(0).toUpperCase() + badge.slice(1)}**`; // Normal badge formatting
        })
        .join("\n");

      // Fetch the user's bio from the Bio model
      let userBio = await Bio.findOne({ userId: target.id });

      if (!userBio) {
        userBio = new Bio({ userId: target.id, bio: "No bio set" });
      }

      // Create the embed message
      const embedMessage = createEmbed({
        color: 0x0000ff,
        fields: [
          { name: "**__BIO__**", value: `> ${userBio.bio}`, inline: false },
          { name: "**__BADGES__**", value: badgeList, inline: false },
        ],
        thumbnailUrl: target.displayAvatarURL(),
        footerText: `ALPHA MUSIC | Requested by ${interaction.user.username}`,
        footerIconUrl: client.user.displayAvatarURL(),
      });

      // Send the reply
      return interaction.reply({
        embeds: [
          embedMessage.setAuthor({
            name: `Badges for ${target.username}`,
            iconURL: client.user.displayAvatarURL(),
          }),
        ],
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        embeds: [
          createEmbed({
            color: 0xff0000,
            fields: [{ name: "An error occurred while fetching badges.", value: `\`\`\`${error.message}\`\`\`` }],
            thumbnailUrl: interaction.user.displayAvatarURL(),
            footerText: `ALPHA MUSIC | Requested by ${interaction.user.username}`,
            footerIconUrl: client.user.displayAvatarURL(),
          }),
        ],
        ephemeral: true,
      });
    }
  },
};