const {
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  StringSelectMenuBuilder,
} = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

const dangerousPermissions = [
  "Administrator",
  "BanMembers",
  "KickMembers",
  "ManageMessages",
  "MentionEveryone",
  "ManageRoles",
  "ManageChannels",
  "ManageGuild",
  "ModerateMembers",
];

module.exports = {
  name: "roleall",
  description: "Add or remove a role to everyone (human/bots/all) in the server.",
  async execute(client, message, args) {
    const executor = message.member;
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);

    if (!executor.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You must be an admin to use this command.`,
            executor.user,
            client
          ),
        ],
      });
    }

    if (!role) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | Please mention a valid role or provide role ID.`,
            executor.user,
            client
          ),
        ],
      });
    }

    if (role.position >= executor.roles.highest.position) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You can't manage this role.`,
            executor.user,
            client
          ),
        ],
      });
    }

    const rolePermissions = new PermissionsBitField(role.permissions);
    const hasDangerous = dangerousPermissions.some((perm) =>
      rolePermissions.has(PermissionsBitField.Flags[perm])
    );

    if (hasDangerous) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | This role has some dangerous permissions, so I can't assign or remove it.`,
            executor.user,
            client
          ),
        ],
      });
    }

    // Ensure full member cache is loaded
    await message.guild.members.fetch();

    const actionRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("action_select")
        .setPlaceholder("Choose action (Add or Remove)")
        .addOptions(
          {
            label: "Add Role",
            value: "add",
          },
          {
            label: "Remove Role",
            value: "remove",
          }
        )
    );

    const msg = await message.reply({
      embeds: [
        createEmbed(
          "#FFFF00",
          `What action would you like to perform on ${role}?\n\nChoose either Add or Remove.`,
          executor.user,
          client
        ),
      ],
      components: [actionRow],
    });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 30000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== executor.id)
        return interaction.reply({
          content: `${emoji.error} | This interaction is not for you.`,
          ephemeral: true,
        });

      await interaction.deferUpdate();
      const action = interaction.values[0]; // "add" or "remove"

      const allMembers = message.guild.members.cache;

      // Prepare filtered lists based on action
      const humans = allMembers.filter(
        (m) =>
          !m.user.bot &&
          (action === "add"
            ? !m.roles.cache.has(role.id)
            : m.roles.cache.has(role.id))
      );
      const bots = allMembers.filter(
        (m) =>
          m.user.bot &&
          (action === "add"
            ? !m.roles.cache.has(role.id)
            : m.roles.cache.has(role.id))
      );
      const all = allMembers.filter((m) =>
        action === "add"
          ? !m.roles.cache.has(role.id)
          : m.roles.cache.has(role.id)
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("humans")
          .setLabel(`Humans (${humans.size})`)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("bots")
          .setLabel(`Bots (${bots.size})`)
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("all")
          .setLabel(`All (${all.size})`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("abort")
          .setLabel("Abort")
          .setStyle(ButtonStyle.Danger)
      );

      msg.edit({
        embeds: [
          createEmbed(
            "#FFFF00",
            `You selected to **${action}** the role ${role}.\nNow choose who to apply this to:`,
            executor.user,
            client
          ),
        ],
        components: [row2],
      });

      const buttonCollector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30000,
      });

      buttonCollector.on("collect", async (button) => {
        if (button.user.id !== executor.id)
          return button.reply({
            content: `${emoji.error} | This interaction is not for you.`,
            ephemeral: true,
          });

        await button.deferUpdate();

        if (button.customId === "abort") {
          return msg.edit({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} | Action aborted.`,
                executor.user,
                client
              ),
            ],
            components: [],
          });
        }

        let targets;
        let type;

        if (button.customId === "humans") {
          targets = humans;
          type = "humans";
        } else if (button.customId === "bots") {
          targets = bots;
          type = "bots";
        } else if (button.customId === "all") {
          targets = all;
          type = "members";
        }

        msg.edit({
          embeds: [
            createEmbed(
              "#00AAFF",
              `${action === "add" ? "Adding" : "Removing"} ${role} to/from ${targets.size} ${type}...`,
              executor.user,
              client
            ),
          ],
          components: [],
        });

        let count = 0;

        for (const member of targets.values()) {
          try {
            if (action === "add") {
              await member.roles.add(role, `roleall command by ${executor.user.tag}`);
            } else {
              await member.roles.remove(role, `roleall command by ${executor.user.tag}`);
            }
            count++;
          } catch (err) {
            console.error(`Failed to ${action} role for ${member.user.tag}:`, err);
          }
        }

        msg.edit({
          embeds: [
            createEmbed(
              "#00FF00",
              `${emoji.tick} | Successfully ${action === "add" ? "added" : "removed"} ${role} to/from ${count} ${type}.`,
              executor.user,
              client
            ),
          ],
        });

        buttonCollector.stop();
      });
    });
  },
};