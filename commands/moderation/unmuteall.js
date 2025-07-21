const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "unmuteall",
  description: "Remove timeouts for all members in the server.",
  async execute(client, message) {
    const executor = message.author;

    // Check if the user has Moderate Members permission
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You don't have permission to unmute members.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if the bot has Moderate Members permission
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | I don't have permission to unmute members.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    const initialMessage = await message.reply({
      embeds: [
        createEmbed(
          "#FFFF00",
          `Tracking Members ${emoji.loading}`,
          executor,
          client,
          null
        ),
      ],
    });

    setTimeout(async () => {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("unmuteall_yes")
          .setLabel("Yes")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("unmuteall_no")
          .setLabel("No")
          .setStyle(ButtonStyle.Secondary)
      );

      await initialMessage.edit({
        embeds: [
          createEmbed(
            "#FFFF00",
            `Are you sure you want to remove timeouts for all members in this server?`,
            executor,
            client,
            null
          ),
        ],
        components: [row],
      });

      const filter = (interaction) =>
        ["unmuteall_yes", "unmuteall_no"].includes(interaction.customId);

      const collector = initialMessage.createMessageComponentCollector({
        filter,
        time: 20000,
      });

      let timeoutHandled = false;

      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== executor.id) {
          return interaction.reply({
            content: `${emoji.error} | You are not authorized to use these buttons.`,
            ephemeral: true,
          });
        }

        if (interaction.customId === "unmuteall_yes") {
          await interaction.deferUpdate();
          await initialMessage.edit({
            embeds: [
              createEmbed(
                "#FFFF00",
                `Removing Timeout From All Members ${emoji.loading}`,
                executor,
                client,
                null
              ),
            ],
            components: [],
          });

          const members = message.guild.members.cache.filter(
            (member) => member.communicationDisabledUntilTimestamp
          );

          for (const member of members.values()) {
            try {
              await member.timeout(null, `Timeout removed by ${executor.tag}`);
            } catch (error) {
              console.error(`Failed to remove timeout for ${member.user.tag}:`, error);
            }
          }

          return initialMessage.edit({
            embeds: [
              createEmbed(
                "#00FF00",
                `${emoji.tick} | Successfully removed timeouts for all members.`,
                executor,
                client,
                null
              ),
            ],
          });
        } else if (interaction.customId === "unmuteall_no") {
          await interaction.deferUpdate();
          return initialMessage.edit({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error}  |Operation canceled.`,
                executor,
                client,
                null
              ),
            ],
            components: [],
          });
        }
      });

      collector.on("end", async (collected) => {
        if (collected.size === 0 && !timeoutHandled) {
          timeoutHandled = true;
          await initialMessage.edit({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} | Timeout: You did not choose in time.`,
                executor,
                client,
                null
              ),
            ],
            components: [],
          });
        }
      });
    }, 5000);
  },
};