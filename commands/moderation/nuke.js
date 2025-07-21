const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "nuke",
  description: "Nuke the current channel with a confirmation prompt.",
  async execute(client, message, args) {
    const executor = message.author;

    // Ensure no arguments are provided
    if (args.length > 0) {
      return;
    }

    // Check if the user has Administrator permission
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} You don't have permission to nuke channels.`,
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
            `${emoji.error} I don't have permission to nuke channels.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    const channel = message.channel;
    const reason = `Nuked by ${executor.tag}`;

    // Create confirmation buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("nuke_yes")
        .setLabel("Yes")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("nuke_no")
        .setLabel("No")
        .setStyle(ButtonStyle.Secondary)
    );

    // Send confirmation message
    const confirmEmbed = createEmbed(
      "#FFA500",
      `⚠️ Are you sure you want to nuke <#${channel.id}>? This action is irreversible.`,
      executor,
      client,
      null
    );

    const confirmationMessage = await channel.send({
      embeds: [confirmEmbed],
      components: [row],
    });

    const collector = confirmationMessage.createMessageComponentCollector({
      time: 30000, // 30 seconds
    });

    collector.on("collect", async (interaction) => {
      if (!interaction.isButton()) return;

      // Ensure the user interacting is the one who issued the command
      if (interaction.user.id !== executor.id) {
        return interaction.reply({
          content: "This is not your confirmation prompt.",
          ephemeral: true,
        });
      }

      if (interaction.customId === "nuke_yes") {
        try {
          // Clone the channel and include the reason for the audit log
          const newChannel = await channel.clone({
            name: channel.name,
            permissions: channel.permissionOverwrites.cache,
            position: channel.position,
            topic: channel.topic,
            nsfw: channel.nsfw,
            reason: reason,  // Audit log reason for cloning
          });

          // Delete the current channel with the reason for the audit log
          await channel.delete({ reason: reason });

          // Send success message in the new channel
          await newChannel.send({
            embeds: [
              createEmbed(
                "#00FF00",
                `${emoji.tick} | This channel has been nuked by **${executor.tag}** 🔥.`,
                executor,
                client,
                null
              ),
            ],
          });

          collector.stop();
        } catch (error) {
          console.error(error);
          return interaction.reply({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} There was an error trying to nuke the channel.`,
                executor,
                client,
                null
              ),
            ],
          });
        }
      } else if (interaction.customId === "nuke_no") {
        await interaction.reply({
          content: "Nuke cancelled.",
          ephemeral: true,
        });
        collector.stop();
      }
    });

    collector.on("end", async () => {
      // Disable buttons after the collector ends
      await confirmationMessage.edit({ components: [] }).catch(() => null);
    });
  },
};