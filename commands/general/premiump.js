const { EmbedBuilder } = require("discord.js"); // Import EmbedBuilder from discord.js
const { cross, premium } = require("../../emoji"); // Import emojis
const PremiumModel = require("../../database/Premium"); // MongoDB model for premium users

module.exports = {
  name: "premium",
  description: "Check premium stats for a user or yourself.",
  execute: async (client, message, args) => {
    // If command has extra arguments other than mention, ignore it
    if (args.length > 1) return;

    // Get the user ID from mention or default to the command executor
    const userId = args[0]?.replace(/[<@!>]/g, "") || message.author.id;

    // Validate user mention or ID
    if (args[0] && isNaN(userId)) return; // Ignore if not a valid mention or ID

    // Fetch premium data for the user
    const userPremium = await PremiumModel.findOne({ userId });

    // Function to determine the plan based on duration
    const getPlanName = (duration) => {
      if (duration.endsWith("m")) {
        const months = parseInt(duration.replace("m", ""), 10);
        // If duration is 1m, 2m, 3m, or 6m, return "Starter Plan"
        if ([1, 2, 3, 6].includes(months)) return "Starter Plan";
      } else if (duration.endsWith("y")) {
        const years = parseInt(duration.replace("y", ""), 10);
        // If duration is 1y, 2y, or 3y, return "Diamond Plan"
        if ([1, 2, 3].includes(years)) return "Diamond Plan";
      } else if (duration.toLowerCase() === "lifetime" || duration.toLowerCase() === "unlimited") {
        // For lifetime or unlimited, return "Developer Plan"
        return "Developer Plan";
      }
      return "hacker Plan";
    };

    // If no premium subscription or expired
    if (!userPremium || (userPremium.expiryDate && new Date(userPremium.expiryDate) < Date.now())) {
      const noPremiumEmbed = new EmbedBuilder()
        .setColor(0xff0000) // Red color for no premium
        .setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(
          `${cross} <@${userId}> does not have an active premium subscription, Want to buy premium? [Buy Now](https://discord.gg/lovers-arenaa)`
        )
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true })) // User avatar as thumbnail
        .setFooter({
          text: `ALPHA MUSIC™ | PREMIUM Stats`,
          iconURL: client.user.displayAvatarURL({ dynamic: true }),
        });

      return message.channel.send({ embeds: [noPremiumEmbed] });
    }

    // Determine the plan name
    const planName = getPlanName(userPremium.duration);

    // Fetch the user for their avatar
    const user = await client.users.fetch(userId);

    // If the user has an active premium subscription
    const premiumEmbed = new EmbedBuilder()
      .setColor(0x00ff00) // Green color for active premium
      .setAuthor({
        name: `Premium Stats for ${user.tag}`,
        iconURL: user.displayAvatarURL({ dynamic: true }), // Correct avatar for the user being checked
      })
      .setDescription(
        `${premium} **Premium Stats for** <@${userId}>:\n\n` +
        `${premium} **Plan**: ${planName}\n` +
        `${premium} **Duration**: ${userPremium.duration}\n` +
        `${premium} **Servers Available**: ${userPremium.servers || 0}\n` +
        `${premium} **Expiry Date**: ${new Date(userPremium.expiryDate).toLocaleString()}`
      )
      .setThumbnail(user.displayAvatarURL({ dynamic: true })) // Correct avatar for the user being checked
      .setFooter({
        text: `ALPHA MUSIC™ | PREMIUM STATS`,
        iconURL: client.user.displayAvatarURL({ dynamic: true }),
      });

    return message.channel.send({ embeds: [premiumEmbed] });
  },
};