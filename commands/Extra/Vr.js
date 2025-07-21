const Autorole = require("../../database/Autorole");
const { PermissionsBitField } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "vcrole",
  aliases: ["vr"],
  description: "Configure VC join role",
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
      data = await Autorole.create({ guildId, roles: [], vcrole: null });
    }

    if (!subcommand) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | Please specify a subcommand: \`set\`, \`remove\`, or \`show\`.`,
            message.author,
            client
          ),
        ],
      });
    }

    if (subcommand === "set") {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      if (!role) {
        return message.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | Please mention a valid role or provide a valid role ID.`, message.author, client)],
        });
      }

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
          embeds: [createEmbed("#FF0000", `${emoji.error} | This role has dangerous permissions and cannot be set as VC role.`, message.author, client)],
        });
      }

      data.vcrole = role.id;
      await data.save();

      return message.reply({
        embeds: [createEmbed("#00FF00", `${emoji.tick} | ${role} has been set as the VC join role.`, message.author, client)],
      });
    }

    if (subcommand === "remove") {
      if (!data.vcrole) {
        return message.reply({
          embeds: [createEmbed("#FF0000", `${emoji.error} | No VC role is currently set.`, message.author, client)],
        });
      }

      data.vcrole = null;
      await data.save();

      return message.reply({
        embeds: [createEmbed("#00FF00", `${emoji.tick} | VC join role has been removed.`, message.author, client)],
      });
    }

    if (subcommand === "show") {
      if (!data.vcrole) {
        return message.reply({
          embeds: [createEmbed("#FFA500", `No VC join role is currently set.`, message.author, client)],
        });
      }

      const role = message.guild.roles.cache.get(data.vcrole);
      return message.reply({
        embeds: [
          createEmbed("#00BFFF", `Current VC join role: ${role || `Unknown Role (\`${data.vcrole}\`)`}`, message.author, client),
        ],
      });
    }

    return message.reply({
      embeds: [createEmbed("#FF0000", `${emoji.error} | Invalid subcommand. Use \`set\`, \`remove\`, or \`show\`.`, message.author, client)],
    });
  },
};