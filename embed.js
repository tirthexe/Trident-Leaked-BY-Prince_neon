// embed.js

const { EmbedBuilder } = require("discord.js");

/**
 * Creates a styled embed.
 * 
 * @param {string} color - Hex color code (e.g., "#FF0000")
 * @param {string} description - Main description text
 * @param {User|GuildMember} user - The user who triggered the command
 * @param {Client} client - The bot client (used for fallback avatar)
 * @returns {EmbedBuilder}
 */
function createEmbed(color, description, user, client) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(description)
    .setFooter({
      text: `Requested by ${user.username || user.displayName}`,
      iconURL: user.displayAvatarURL({ dynamic: true }) || client.user.displayAvatarURL({ dynamic: true })
    });

  return embed;
}

module.exports = { createEmbed };