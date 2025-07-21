const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const Autorole = require("../../database/Autorole");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Configure autorole settings')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a new autorole')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to add to autorole')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove an autorole')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to remove from autorole')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all autoroles in the server')
    ),

  async execute(interaction, client) {  // client and interaction are passed here
    if (
      !interaction.guild ||
      !interaction.member?.permissions?.has(PermissionsBitField.Flags.Administrator)
    ) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription(`${emoji.error} | You don't have enough permissions to use this command.`)
        ],
        ephemeral: true
      });
    }

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    let data = await Autorole.findOne({ guildId });
    if (!data) {
      data = await Autorole.create({ guildId, roles: [] });
    }

    if (subcommand === 'add') {
      const role = interaction.options.getRole('role');
      const botMember = await interaction.guild.members.fetch(client.user.id);

      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | I can't manage this role because it is higher or equal to my highest role.`, interaction.user, client)],
        });
      }

      const dangerousPerms = [
        "Administrator", "ManageMessages", "ManageGuild", "MuteMembers", 
        "BanMembers", "KickMembers", "ManageRoles", "ManageChannels", "ModerateMembers"
      ];

      const hasDangerous = dangerousPerms.some(perm =>
        role.permissions.has(PermissionsBitField.Flags[perm])
      );

      if (hasDangerous) {
        return interaction.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | I can't add this role. It has dangerous permissions.`, interaction.user, client)],
        });
      }

      if (data.roles.includes(role.id)) {
        return interaction.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | This role is already added to autorole.`, interaction.user, client)],
        });
      }

      if (data.roles.length >= 10) {
        return interaction.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | You can only have up to 10 autoroles per server.`, interaction.user, client)],
        });
      }

      data.roles.push(role.id);
      await data.save();

      return interaction.reply({
        embeds: [createEmbed("#00FF00", `${emoji.tick} | ${role} added to autorole for this server.`, interaction.user, client)],
      });
    }

    if (subcommand === 'remove') {
      const role = interaction.options.getRole('role');

      if (!data.roles.includes(role.id)) {
        return interaction.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | This role is not in the autorole list.`, interaction.user, client)],
        });
      }

      data.roles = data.roles.filter(id => id !== role.id);
      await data.save();

      return interaction.reply({
        embeds: [createEmbed("#00FF00", `${emoji.tick} | ${role} removed from autorole for this server.`, interaction.user, client)],
      });
    }

    if (subcommand === 'list') {
      if (data.roles.length === 0) {
        return interaction.reply({
          embeds: [createEmbed("#FFA500", "No autoroles set for this server.", interaction.user, client)],
        });
      }

      const list = data.roles
        .map((roleId, index) => {
          const role = interaction.guild.roles.cache.get(roleId);
          return role ? `[${index + 1}] ${role} | \`${role.id}\`` : `[${index + 1}] Unknown Role | \`${roleId}\``;
        })
        .join("\n");

      return interaction.reply({
        embeds: [
          createEmbed("#00BFFF", `**Autoroles for this server:**\n\n${list}`, interaction.user, client)
        ],
      });
    }
  },
};