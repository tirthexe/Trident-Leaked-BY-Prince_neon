const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const Autorole = require("../../database/Autorole");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("voicerole")
    .setDescription("Manage the VC join role.")
    .addSubcommand(sub =>
      sub
        .setName("set")
        .setDescription("Set a VC join role.")
        .addRoleOption(opt =>
          opt.setName("role").setDescription("The role to assign on VC join").setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName("remove").setDescription("Remove the currently set VC join role.")
    )
    .addSubcommand(sub =>
      sub.setName("show").setDescription("Show the current VC join role.")
    ),

  async execute(interaction) {
    const { options, guild, user, client, member } = interaction;
    const sub = options.getSubcommand();

    if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You don't have permission to use this command.`,
            user,
            client
          ),
        ],
        ephemeral: true,
      });
    }

    const guildId = guild.id;
    let data = await Autorole.findOne({ guildId });
    if (!data) {
      data = await Autorole.create({ guildId, roles: [], vcrole: null });
    }

    if (sub === "set") {
      const role = options.getRole("role");
      const botMember = await guild.members.fetchMe();

      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | I can't manage this role because it is higher or equal to my highest role.`,
              user,
              client
            ),
          ],
          ephemeral: true,
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
        "ModerateMembers",
      ];

      const hasDangerous = dangerousPerms.some(perm =>
        role.permissions.has(PermissionsBitField.Flags[perm])
      );
      if (hasDangerous) {
        return interaction.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | This role has dangerous permissions and cannot be set as VC role.`,
              user,
              client
            ),
          ],
          ephemeral: true,
        });
      }

      data.vcrole = role.id;
      await data.save();

      return interaction.reply({
        embeds: [
          createEmbed(
            "#00FF00",
            `${emoji.tick} | ${role} has been set as the VC join role.`,
            user,
            client
          ),
        ],
      });
    }

    if (sub === "remove") {
      if (!data.vcrole) {
        return interaction.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | No VC role is currently set.`,
              user,
              client
            ),
          ],
          ephemeral: true,
        });
      }

      data.vcrole = null;
      await data.save();

      return interaction.reply({
        embeds: [
          createEmbed(
            "#00FF00",
            `${emoji.tick} | VC join role has been removed.`,
            user,
            client
          ),
        ],
      });
    }

    if (sub === "show") {
      if (!data.vcrole) {
        return interaction.reply({
          embeds: [
            createEmbed("#FFA500", `No VC join role is currently set.`, user, client),
          ],
        });
      }

      const role = guild.roles.cache.get(data.vcrole);
      return interaction.reply({
        embeds: [
          createEmbed(
            "#00BFFF",
            `Current VC join role: ${role || `Unknown Role (\`${data.vcrole}\`)`}`,
            user,
            client
          ),
        ],
      });
    }
  },
};