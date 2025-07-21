const { PermissionsBitField } = require('discord.js');
const { createEmbed } = require('../../embed');
const emoji = require('../../emoji');

module.exports = {
  name: 'roleicon',
  description: 'Set an icon for a specified role using mention or ID and log the reason in audit logs',
  async execute(client, message, args) {
    const executor = message.author;

    // Check if the user has Manage Roles permission
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | You need the **Manage Roles** permission to use this command.`, executor, client, null)],
      });
    }

    const roleInput = args[0]; // Either role mention or role ID
    const emojiInput = args[1]; // Emoji to set as icon

    // Validate inputs
    if (!roleInput || !emojiInput) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | Usage: roleicon @role or <roleID> <emoji>`, executor, client, null)],
      });
    }

    // Fetch the role (support both mention and ID)
    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(roleInput) ||
      (await message.guild.roles.fetch(roleInput).catch(() => null)); // Fetch by ID if not cached

    if (!role) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | Invalid role. Please mention a valid role or provide a valid role ID.`, executor, client, null)],
      });
    }

    // Ensure the user's highest role is higher than the mentioned role
    if (role.position >= message.member.roles.highest.position) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | You can only change the icon for roles below your highest role.`, executor, client, null)],
      });
    }

    // Ensure the bot's highest role is higher than the mentioned role
    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | I do not have enough permissions to change the icon for this role. Please ensure my highest role is above the role you're trying to update.`, executor, client, null)],
      });
    }

    let emojiUrl = null;
    try {
      if (emojiInput.startsWith('<:') || emojiInput.startsWith('<a:')) {
        // Handle custom emoji (extract emoji ID)
        const emojiId = emojiInput.split(':')[2].replace('>', '');
        emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.png`;
      } else {
        // Handle Unicode emoji (convert it to a URL)
        emojiUrl = `https://twemoji.maxcdn.com/v/latest/72x72/${emojiInput.codePointAt(0).toString(16)}.png`;
      }

      // Change the role icon and add reason in the audit log
      await role.setIcon(emojiUrl, `Role icon changed by ${executor.tag}`);

      return message.reply({
        embeds: [createEmbed('#00FF00', `${emoji.tick} | Successfully changed the role icon for ${role}.`, executor, client, null)],
      });
    } catch (error) {
      console.error('Error changing role icon:', error);
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | Failed to change the role icon. Please ensure the emoji is valid and that I have sufficient permissions.`, executor, client, null)],
      });
    }
  },
};