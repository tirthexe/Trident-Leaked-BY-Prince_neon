const BadgeDB = require("../../database/badge"); // MongoDB schema for badges
const Bio = require("../../database/bio"); // MongoDB schema for bios
const { developer, owner, management, admin, mod, staff, vip, supporter, voter, members, anvi } = require("../../emoji"); // Import emoji mappings
const { EmbedBuilder } = require('discord.js'); // Import EmbedBuilder from discord.js v14

module.exports = {
  name: "pr",
  aliases:["badges", "badge"], 
  description: "Show badges and bio for a mentioned user or the message author.",
  async execute(client, message, args) {
    const target = message.mentions.users.first() || message.author;

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
      "members"
    ];

    // Embed creation function (EmbedBuilder version)
    const createEmbed = ({ color, fields, thumbnailUrl, footerText, footerIconUrl }) => {
      return new EmbedBuilder()
        .setColor(color)
        .addFields(fields)
        .setThumbnail(thumbnailUrl)
        .setFooter({ text: footerText, iconURL: footerIconUrl });
    };

    try {
      let userBadges = await BadgeDB.findOne({ userId: target.id });

      // Ensure that user always has the "ANVI" badge if they are the specified user
      if (!userBadges) {
        userBadges = new BadgeDB({ userId: target.id, badges: [] });
      }

      // Only the user with ID "1193914675021238283" should have the "ANVI" badge
      if (target.id === '1193914675021238283') {
        // Add "ANVI" badge to the top if not already present
        if (!userBadges.badges.includes("anvi")) {
          userBadges.badges.unshift("anvi"); // Add "ANVI" badge to the top of the list
          await userBadges.save();
        }
      } else {
        // Remove "ANVI" badge from other users, if present
        userBadges.badges = userBadges.badges.filter(badge => badge !== "anvi");
        await userBadges.save();
      }

      // Ensure "members" badge is always included (if missing)
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
        anvi: 'https://discord.com/users/1193914675021238283', // The clickable link for ANVI
      };

      const sortedBadges = badgeOrder.filter(badge => userBadges.badges.includes(badge));

      const badgeList = sortedBadges
        .map((badge) => {
          if (badge === "anvi") {
            return `${badgeEmojis[badge]} [**ANVI**](${badgeLinks[badge]})`; // Add the clickable link for ANVI
          }
          return `${badgeEmojis[badge]} **${badge.charAt(0).toUpperCase() + badge.slice(1)}**`; // Normal badge formatting
        })
        .join("\n");

      // Fetch the user's bio from the Bio model
      let userBio = await Bio.findOne({ userId: target.id });

      if (!userBio) {
        userBio = new Bio({ userId: target.id, bio: "No bio set" });
      }

      // Create the embed message with formatted details
      const embedMessage = createEmbed({
        color: 0x0000ff,
        fields: [
          { name: '**__BIO__**', value: `> ${userBio.bio}`, inline: false },
          { name: '**__BADGES__**', value: badgeList, inline: false },
        ],
        thumbnailUrl: target.displayAvatarURL(),
        footerText: `TRIDENT™ DEVELOPEMENT | Requested by ${message.author.username}`,
        footerIconUrl: client.user.displayAvatarURL(),
      });

      return message.channel.send({
        embeds: [embedMessage.setAuthor({
          name: `Badges for ${target.username}`,
          iconURL: client.user.displayAvatarURL()
        })],
      });
    } catch (error) {
      console.error(error);
      return message.channel.send({
        embeds: [
          createEmbed({
            color: 0xff0000,
            fields: [{ name: "An error occurred while fetching badges.", value: `\`\`\`${error.message}\`\`\`` }],
            thumbnailUrl: message.author.displayAvatarURL(),
            footerText: `ALPHA MUSIC | Requested by ${message.author.username}`,
            footerIconUrl: client.user.displayAvatarURL(),
          }),
        ],
      });
    }
  },
};