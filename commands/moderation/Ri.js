const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { createEmbed } = require('../../embed');
const emoji = require('../../emoji');

module.exports = {
  name: 'roleinfo',
  aliases: ['ri'],
  description: 'Displays detailed information about a specified role.',
  async execute(client, message, args) {
    const executor = message.author;

    // Check if user has the Manage Roles permission
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | You need the **Manage Roles** permission to use this command.`, executor, client, null)],
      });
    }

    const roleInput = args[0];
    if (!roleInput) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | Please mention a role or provide a valid role ID.`, executor, client, null)],
      });
    }

    // Fetch the role (supports mention and ID)
    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(roleInput) ||
      (await message.guild.roles.fetch(roleInput).catch(() => null)); // Fetch role by ID if not cached

    if (!role) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | Invalid role. Please mention a valid role or provide a valid role ID.`, executor, client, null)],
      });
    }

    // Role information
    const memberCount = role.members.size; // Count of users with this role
    const isHoisted = role.hoist ? 'Yes (Visible)' : 'No (Invisible)';
    const rolePosition = role.position;
    const roleColor = role.hexColor === '#000000' ? 'Default (No color)' : role.hexColor;
    const creationDate = `<t:${Math.floor(role.createdTimestamp / 1000)}:F>`; // Format as Discord timestamp

    // Create embed for role information
    const embed = new EmbedBuilder()
      .setTitle(`Role Information: ${role.name}`)
      .setColor(role.hexColor || '#00FF00')
      .setThumbnail(role.iconURL() || null) // Add role icon if it exists
      .addFields(
        { name: 'Role Mention:', value: `${role}`, inline: true },
        { name: 'Role ID:', value: `${role.id}`, inline: true },
        { name: 'Position:', value: `${rolePosition}`, inline: true },
        { name: 'Hex Color:', value: `${roleColor}`, inline: true },
        { name: 'Hoisted (Visible):', value: `${isHoisted}`, inline: true },
        { name: 'Users with Role:', value: `${memberCount}`, inline: true },
        { name: 'Mentionable:', value: `${role.mentionable ? 'Yes' : 'No'}`, inline: true },
        { name: 'Created On:', value: `${creationDate}`, inline: false },
      )
      .setFooter({ text: `Requested by ${executor.tag}`, iconURL: executor.displayAvatarURL({ dynamic: true }) });

    return message.reply({ embeds: [embed] });
  },
};