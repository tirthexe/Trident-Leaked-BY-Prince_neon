const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
  SlashCommandBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("report")
    .setDescription("Get bot support or report a bug."),

  async execute(client, interaction) {
    const guildId = "1313726364834070538"; // Support server ID
    const supportRoleId = "1321822754730934272"; // Support role ID
    const categoryId = "1321824573234216960"; // Support category ID

    const user = interaction.user;

    try {
      const supportGuild = client.guilds.cache.get(guildId);
      if (!supportGuild) {
        return interaction.reply(
          "Support server not found. Please contact the bot owner."
        );
      }

      // Check if the user already has a ticket channel in the category
      const existingChannel = supportGuild.channels.cache.find(
        (channel) =>
          channel.parentId === categoryId &&
          channel.topic === `Support ticket for ${user.id}`
      );

      if (existingChannel) {
        return interaction.reply(
          "You already have an open ticket. Please use your existing ticket for further assistance."
        );
      }

      const dmChannel = await user.createDM().catch(() => null);

      if (!dmChannel) {
        return interaction.reply(
          "It seems your DMs are closed. Please enable your DMs in this server and try again."
        );
      }

      const embed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("How can we assist you today?")
        .setDescription(
          `Hey <@${user.id}>, you can type your message below to let us know:\n\n` +
          `<:emoji_1:1315672351685345311>  Any **bug reports** you’ve encountered.\n` +
          `<:emoji_1:1315672351685345311>  **Suggestions** to improve our bot.\n` +
          `<:emoji_1:1315672351685345311>  General inquiries or support requests.\n\n` +
          `For direct discussions with our developers and staff, join our [Support Server](https://discord.gg/lovers-arenaa).\n` +
          `We’re excited to assist you!`
        )
        .setFooter({ text: "ALPHA MUSIC™ | .gg/lovers-arenaa" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`submit_support_${user.id}`)
          .setLabel("Submit")
          .setStyle(ButtonStyle.Primary)
      );

      const sentMessage = await dmChannel.send({
        embeds: [embed],
        components: [row],
      });

      const filter = (interaction) =>
        interaction.customId === `submit_support_${user.id}` &&
        interaction.user.id === user.id;

      const collector = dmChannel.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (interaction) => {
        // Disable the button after use
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`submit_support_${user.id}`)
            .setLabel("Submit")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        );
        await sentMessage.edit({ components: [disabledRow] });

        const modal = new ModalBuilder()
          .setCustomId(`support_modal_${user.id}`)
          .setTitle("Submit Your Report");

        const reportInput = new TextInputBuilder()
          .setCustomId("report_input")
          .setLabel("Describe your issue or request:")
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("Please provide as much detail as possible.")
          .setRequired(true);

        const modalRow = new ActionRowBuilder().addComponents(reportInput);
        modal.addComponents(modalRow);

        await interaction.showModal(modal);
      });

      client.on("interactionCreate", async (interaction) => {
        if (
          interaction.isModalSubmit() &&
          interaction.customId === `support_modal_${user.id}`
        ) {
          const reportContent = interaction.fields.getTextInputValue(
            "report_input"
          );

          const ticketCategory = supportGuild.channels.cache.get(categoryId);
          if (!ticketCategory) {
            return interaction.reply({
              content: "Support category not found. Please contact the bot owner.",
              ephemeral: true,
            });
          }

          // Create a new ticket channel
          const ticketChannel = await supportGuild.channels.create({
            name: `ticket-${user.username}`,
            parent: categoryId,
            topic: `Support ticket for ${user.id}`,
            permissionOverwrites: [
              {
                id: supportGuild.roles.everyone.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
              },
              {
                id: supportRoleId,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                ],
              },
            ],
          });

          const channelEmbed = new EmbedBuilder()
            .setColor("#FFA500")
            .setTitle("New Support Ticket")
            .setDescription(
              `**Request by:** ${user.tag} (${user.id})\n\n` +
              `**Report:** ${reportContent}`
            )
            .setTimestamp()
            .setAuthor({
              name: user.tag,
              iconURL: user.displayAvatarURL(),
            });

          const channelRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`reply_to_user_${user.id}`)
              .setLabel("Reply to User")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`close_ticket_${user.id}`)
              .setLabel("Close Ticket")
              .setStyle(ButtonStyle.Danger)
          );

          await ticketChannel.send({
            content: `<@&${supportRoleId}>`,
            embeds: [channelEmbed],
            components: [channelRow],
          });

          await interaction.reply({
            content: "Your report has been sent to our support team. We’ll get back to you soon.",
            ephemeral: true,
          });
        }

        if (interaction.isButton()) {
          const existingChannel = interaction.channel;

          // Handle "Reply to User" button
          if (interaction.customId === `reply_to_user_${user.id}`) {
            await interaction.deferReply({ ephemeral: true });

            const messageCollector = existingChannel.createMessageCollector({
              filter: (msg) => msg.author.id === interaction.user.id,
              max: 1,
              time: 60000,
            });

            messageCollector.on("collect", async (replyMessage) => {
              const replyEmbed = new EmbedBuilder()
                .setColor("#00FF00")
                .setTitle("REPORT REPLY ")
                .setDescription(`**Message:** ${replyMessage.content}`)
                .setAuthor({
                  name: interaction.user.tag,
                  iconURL: interaction.user.displayAvatarURL(),
                })
                .setFooter({
                  text: "ALPHA MUSIC",
                  iconURL: client.user.displayAvatarURL(),
                });

              const userDmChannel = await user.createDM();
              await userDmChannel.send({ embeds: [replyEmbed] });

              await interaction.editReply({
                content: "Your reply has been sent to the user.",
              });
            });

            messageCollector.on("end", (collected, reason) => {
              if (reason === "time") {
                interaction.editReply({
                  content: "You took too long to reply. Please try again.",
                });
              }
            });
          }

          // Handle "Close Ticket" button
          if (interaction.customId === `close_ticket_${user.id}`) {
            const userDmChannel = await user.createDM();
            await userDmChannel.send(
              "Thank you for reaching out! Your ticket has been closed. If you have further questions, feel free to open another ticket."
            );
            await interaction.channel.delete();
          }
        }
      });
    } catch (error) {
      console.error("Error in support command:", error);
      interaction.reply("An error occurred while processing your support request.");
    }
  },
};