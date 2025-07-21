const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "unlockall",
  description: "Unlock all channels in the server for everyone.",
  async execute(client, message) {
    const executor = message.author;

    // Check if the user has Manage Channels permission
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} You don't have permission to unlock channels.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if the bot has Manage Channels permission
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} I don't have permission to unlock channels.`,
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
          `Tracking All Channels ${emoji.loading}`,
          executor,
          client,
          null
        ),
      ],
    });

    setTimeout(async () => {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("unlockall_yes")
          .setLabel("Yes")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("unlockall_no")
          .setLabel("No")
          .setStyle(ButtonStyle.Secondary)
      );

      await initialMessage.edit({
        embeds: [
          createEmbed(
            "#FFFF00",
            `Are you sure you want to unlock all channels in this server?`,
            executor,
            client,
            null
          ),
        ],
        components: [row],
      });

      const filter = (interaction) =>
        ["unlockall_yes", "unlockall_no"].includes(interaction.customId);

      const collector = initialMessage.createMessageComponentCollector({
        filter,
        time: 20000,
      });

      let timeoutHandled = false;

      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== executor.id) {
          return interaction.reply({
            content: `${emoji.error} You are not authorized to use these buttons.`,
            ephemeral: true,
          });
        }

        if (interaction.customId === "unlockall_yes") {
          await interaction.deferUpdate();
          await initialMessage.edit({
            embeds: [
              createEmbed(
                "#FFFF00",
                `Unlocking All Channels ${emoji.loading}`,
                executor,
                client,
                null
              ),
            ],
            components: [],
          });

          const channels = message.guild.channels.cache.filter(
            (channel) => channel.isTextBased() && channel.viewable
          );

          for (const channel of channels.values()) {
            try {
              await channel.permissionOverwrites.edit(
                message.guild.roles.everyone,
                { SendMessages: true },
                { reason: `Unlock all channels triggered by ${executor.tag}` }
              );
            } catch (error) {
              console.error(`Failed to unlock channel ${channel.name}:`, error);
            }
          }

          return initialMessage.edit({
            embeds: [
              createEmbed(
                "#00FF00",
                `${emoji.tick} All channels have been successfully unlocked.`,
                executor,
                client,
                null
              ),
            ],
          });
        } else if (interaction.customId === "unlockall_no") {
          await interaction.deferUpdate();
          return initialMessage.edit({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} Operation canceled.`,
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
                `${emoji.error} Timeout: You did not choose in time.`,
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