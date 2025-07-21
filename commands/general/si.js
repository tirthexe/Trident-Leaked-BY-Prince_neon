const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "serverinfo",
  aliases: ["si"],
  description: "Get detailed server info.",
  async execute(client, message, args) {
    const guild = message.guild;

    // Get the owner ID directly from the guild object
    const ownerId = guild.ownerId;

    // Fetch additional information
    const boostChannel = guild.premiumProgressBarEnabled ? guild.channels.cache.get(guild.premiumTier) : null;
    const vanity = guild.vanityURLCode || "None";
    const verificationLevel = guild.verificationLevel ? guild.verificationLevel.toString() : "Unknown"; // Ensure it's a string
    const topRole = guild.roles.cache.highest || { id: "None" }; // Fallback to a default object if no top role
    const afkChannel = guild.afkChannel ? guild.afkChannel.name : "None";
    const afkTimeout = guild.afkTimeout ? (guild.afkTimeout / 60).toString() : "0"; // Convert from seconds to minutes
    const memberCount = guild.memberCount ? guild.memberCount.toString() : "0";
    const region = guild.region || "Unknown";
    const creationDate = guild.createdAt ? guild.createdAt.toLocaleDateString() : "Unknown";

    // Determine Partnered/Verified status
    const partnerStatus = guild.partnered ? "Partnered" : guild.verified ? "Verified" : "None";

    try {
      const embed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle(`Server Info for **${guild.name}**`)
        .setThumbnail(guild.iconURL())
        .setImage(guild.bannerURL() || null)
        .addFields(
          { name: "Owner", value: `<@${ownerId}>`, inline: true },
          { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
          { name: "Top Role", value: topRole.id === "None" ? "None" : `<@&${topRole.id}>`, inline: true },
          { name: "Verification", value: verificationLevel, inline: true },
          { name: "Boost Channel", value: boostChannel ? `#${boostChannel.name}` : "None", inline: true },
          { name: "Vanity URL", value: vanity, inline: true },
          { name: "Creation Date", value: creationDate, inline: true },
          { name: "Member Count", value: memberCount, inline: true },
          { name: "Region", value: region, inline: true },
          { name: "Partnered/Verified", value: partnerStatus, inline: true },
          { name: "AFK Channel", value: afkChannel, inline: true },
          { name: "AFK Timeout", value: `${afkTimeout} minutes`, inline: true }
        )
        .setFooter({
          text: "Tident",
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

      // Send the embed message
      await message.channel.send({
        embeds: [embed],
      });
    } catch (error) {
      console.error("Error creating embed:", error);
      return message.reply({
        content: "There was an error generating the server info. Please try again later.",
      });
    }
  },
};