const Autorole = require("../../database/Autorole");
const { PermissionsBitField } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "autorole",
  aliases: ["ar"],
  description: "Configure autorole settings",
  async execute(client, message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You don't have enough permissions to use this command.`,
            message.author,
            client
          ),
        ],
      });
    }

    const subcommand = args[0];
    const guildId = message.guild.id;

    let data = await Autorole.findOne({ guildId });
    if (!data) {
      data = await Autorole.create({ guildId, roles: [] });
    }

    if (!subcommand) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | Please specify a subcommand: \`add\`, \`remove\`, or \`list\`.`,
            message.author,
            client
          ),
        ],
      });
    }

    if (subcommand === "add") {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      if (!role) {
        return message.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | Please mention a valid role or provide a valid role ID.`, message.author, client)],
        });
      }

      // Bot role hierarchy check
      const botMember = await message.guild.members.fetch(client.user.id);
      if (role.position >= botMember.roles.highest.position) {
        return message.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | I can't manage this role because it is higher or equal to my highest role.`, message.author, client)],
        });
      }

      const dangerousPerms = [
        "Administrator",
        "ManageMessages",
        "ManageGuild",
        "MuteMembers",
        "BanMembers",
        "KickMembers",
        "ManageRoles",
        "ManageChannels",
        "ModerateMembers"
      ];

      const hasDangerous = dangerousPerms.some(perm => role.permissions.has(PermissionsBitField.Flags[perm]));
      if (hasDangerous) {
        return message.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | I can't add this role. It has dangerous permissions.`, message.author, client)],
        });
      }

      if (data.roles.includes(role.id)) {
        return message.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | This role is already added to autorole.`, message.author, client)],
        });
      }

      if (data.roles.length >= 10) {
        return message.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | You can only have up to 10 autoroles per server.`, message.author, client)],
        });
      }

      data.roles.push(role.id);
      await data.save();

      return message.reply({
        embeds: [createEmbed("#00FF00", `${emoji.tick} | ${role} added to autorole for this server.`, message.author, client)],
      });
    }

    if (subcommand === "remove") {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      if (!role) {
        return message.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | Please mention a valid role or provide a valid role ID.`, message.author, client)],
        });
      }

      if (!data.roles.includes(role.id)) {
        return message.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | This role is not in the autorole list.`, message.author, client)],
        });
      }

      data.roles = data.roles.filter(id => id !== role.id);
      await data.save();

      return message.reply({
        embeds: [createEmbed("#00FF00", `${emoji.tick} | ${role} removed from autorole for this server.`, message.author, client)],
      });
    }

    if (subcommand === "list") {
      if (data.roles.length === 0) {
        return message.reply({
          embeds: [createEmbed("#FFA500", "No autoroles set for this server.", message.author, client)],
        });
      }

      const list = data.roles
        .map((roleId, index) => {
          const role = message.guild.roles.cache.get(roleId);
          return role ? `[${index + 1}] ${role} | \`${role.id}\`` : `[${index + 1}] Unknown Role | \`${roleId}\``;
        })
        .join("\n");

      return message.reply({
        embeds: [
          createEmbed(
            "#00BFFF",
            `**Autoroles for this server:**\n\n${list}`,
            message.author,
            client
          ),
        ],
      });
    }

    return message.reply({
      embeds: [createEmbed("#FF0000", `${emoji.error} | Invalid subcommand. Use \`add\`, \`remove\`, or \`list\`.`, message.author, client)],
    });
  },
};