const { PermissionsBitField } = require('discord.js');
const RoleSetup = require('../../database/RoleSetup');
const { createEmbed } = require('../../embed');
const emoji = require('../../emoji');

module.exports = {
  name: 'setup',
  description: 'Setup role assignment system',
  async execute(client, message, args) {
    const executor = message.author;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | You must be an admin to use this command.`, executor, client)],
      });
    }

    const subCommand = args[0]?.toLowerCase();
    const keyword = args[1]?.toLowerCase();
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);

    // Add a role to the setup
    if (subCommand === 'add') {
      if (!keyword || !role) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | Usage: \`setup add <keyword> <@role/roleId>\``, executor, client)],
        });
      }

      // Check if the keyword already exists in the database
      const existingSetup = await RoleSetup.findOne({ guildId: message.guild.id, name: keyword });
      if (existingSetup) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | A role setup with this keyword already exists.`, executor, client)],
        });
      }

      await RoleSetup.create({ guildId: message.guild.id, name: keyword, roleId: role.id });
      return message.reply({
        embeds: [createEmbed('#00FF00', `${emoji.tick} | Successfully added role ${role} with keyword \`${keyword}\`.`, executor, client)],
      });
    }

    // Remove a role setup
    if (subCommand === 'remove') {
      if (!keyword) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | Usage: \`setup remove <keyword>\``, executor, client)],
        });
      }

      const setupToRemove = await RoleSetup.findOne({ guildId: message.guild.id, name: keyword });
      if (!setupToRemove) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | No setup found with the keyword \`${keyword}\`.`, executor, client)],
        });
      }

      await RoleSetup.findOneAndDelete({ guildId: message.guild.id, name: keyword });
      return message.reply({
        embeds: [createEmbed('#00FF00', `${emoji.tick} | Successfully removed the role setup with keyword \`${keyword}\`.`, executor, client)],
      });
    }

    // Set manager role
    if (subCommand === 'set' && args[1]?.toLowerCase() === 'manager') {
      const managerRole = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);

      if (!managerRole) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | Usage: \`setup set manager <@role/roleId>\``, executor, client)],
        });
      }

      const existingManager = await RoleSetup.findOne({ guildId: message.guild.id, name: 'managerRole' });
      if (existingManager && existingManager.managerRoleId !== managerRole.id) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | Manager role already set. Please remove it first or update the existing one.`, executor, client)],
        });
      }

      await RoleSetup.findOneAndUpdate(
        { guildId: message.guild.id, name: 'managerRole' },
        { guildId: message.guild.id, managerRoleId: managerRole.id },
        { upsert: true }
      );

      return message.reply({
        embeds: [createEmbed('#00FF00', `${emoji.tick} | Manager role set to ${managerRole}.`, executor, client)],
      });
    }

    // List all roles and manager role
    if (subCommand === 'list') {
      const setups = await RoleSetup.find({ guildId: message.guild.id });
      const managerRoleData = setups.find((setup) => setup.name === 'managerRole');

      if (!setups.length) {
        return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | No setups found.`, executor, client)] });
      }

      const managerRoleMention = managerRoleData?.managerRoleId ? `<@&${managerRoleData.managerRoleId}>` : 'Not set';
      const roleList = setups
        .filter((setup) => setup.name !== 'managerRole')
        .map((setup) => `\`${setup.name}\` : <@&${setup.roleId}>`)
        .join('\n');

      return message.reply({
        embeds: [createEmbed('#00FF00', `**Roles Setup:**\n> **Manager Role:** ${managerRoleMention}\n\n${roleList}`, executor, client)],
      });
    }

    // Invalid subcommands or no arguments
    return message.reply({
      embeds: [
        createEmbed(
          '#FF0000',
          `${emoji.error} | Invalid command. Here are valid options:\n` +
            '`setup add <keyword> <@role>` - Add a role setup.\n' +
            '`setup remove <keyword>` - Remove a role setup.\n' +
            '`setup set manager <@role>` - Set the manager role.\n' +
            '`setup list` - Show all custom roles and manager role.\n',
          executor,
          client
        ),
      ],
    });
  },
};