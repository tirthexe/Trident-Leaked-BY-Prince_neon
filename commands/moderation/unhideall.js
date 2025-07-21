const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "unhideall",
  description: "Unhide all channels in the server for everyone.",
  async execute(client, message) {
    const executor = message.author;

    // Check if the user has Manage Channels permission
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} You don't have permission to unhide channels.`,
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
            `${emoji.error} I don't have permission to unhide channels.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Send initial message with "Please wait"
    const initialMessage = await message.reply({
      embeds: [
        createEmbed(
          "#FFFF00",
          `Tracking All Channels ${emoji.loading} `,
          executor,
          client,
          null
        ),
      ],
    });

    // Simulate delay before showing confirmation
    setTimeout(async () => {
      // Edit the message to ask for confirmation
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("unhideall_yes")
          .setLabel("Yes")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("unhideall_no")
          .setLabel("No")
          .setStyle(ButtonStyle.Secondary)
      );

      await initialMessage.edit({
        embeds: [
          createEmbed(
            "#FFFF00",
            `Are you sure you want to unhide all channels in this server?`,
            executor,
            client,
            null
          ),
        ],
        components: [row],
      });

      // Create a collector for button interactions
      const filter = (interaction) =>
        ["unhideall_yes", "unhideall_no"].includes(interaction.customId);

      const collector = initialMessage.createMessageComponentCollector({
        filter,
        time: 20000, // 20 seconds
      });

      let timeoutHandled = false;

      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== executor.id) {
          return interaction.reply({
            content: `${emoji.error} You are not authorized to use these buttons.`,
            ephemeral: true,
          });
        }

        if (interaction.customId === "unhideall_yes") {
          // Acknowledge the button press
          await interaction.deferUpdate();

          // Notify that the unhiding process is starting
          await initialMessage.edit({
            embeds: [
              createEmbed(
                "#FFFF00",
                `Unhiding All channels ${emoji.loading}`,
                executor,
                client,
                null
              ),
            ],
            components: [],
          });

          // Unhide all channels
          const channels = message.guild.channels.cache.filter(
            (channel) => channel.isTextBased() && channel.viewable
          );

          for (const channel of channels.values()) {
            try {
              await channel.permissionOverwrites.edit(
                message.guild.roles.everyone,
                { ViewChannel: true },
                { reason: `Unhide all channels triggered by ${executor.tag}` }
              );
            } catch (error) {
              console.error(`Failed to unhide channel ${channel.name}:`, error);
            }
          }

          // Notify that all channels are unhidden
          return initialMessage.edit({
            embeds: [
              createEmbed(
                "#00FF00",
                `${emoji.tick} All channels have been successfully unhidden.`,
                executor,
                client,
                null
              ),
            ],
          });
        } else if (interaction.customId === "unhideall_no") {
          // Acknowledge the button press and cancel the operation
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
    }, 5000); // 5 seconds delay
  },
};