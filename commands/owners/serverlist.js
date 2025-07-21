const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");
const { ownerID } = require("../../owner");

module.exports = {
  name: "guildlist",
  description: "Fetch list of guilds the bot is in (Owner only).",
  async execute(client, message, args) {
    try {
      if (message.author.id !== ownerID) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} You do not have permission to use this command.`,
              message.author,
              client,
              "user"
            ),
          ],
        });
      }

      const itemsPerPage = 5;
      const totalGuilds = Array.from(client.guilds.cache.values());

      const createButtons = (activePage, totalPages) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("previous_page")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(activePage === 1),
          new ButtonBuilder()
            .setCustomId("next_page")
            .setLabel("Next")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(activePage === totalPages),
          new ButtonBuilder()
            .setCustomId("leave_guild")
            .setLabel("Leave Guild")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("get_invite_link")
            .setLabel("Get Link")
            .setStyle(ButtonStyle.Secondary)
        );
      };

      const createGuildListEmbed = (page) => {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const guildsPage = totalGuilds.slice(start, end);

        const guildList = guildsPage
          .map(
            (guild, index) =>
              `**${start + index + 1}. ${guild.name}** [${guild.memberCount} members]`
          )
          .join("\n") || "No guilds available.";

        return createEmbed(
          "#5865F2",
          `**Guild List**\n\n` +
            `**Total Guilds**: ${totalGuilds.length}\n` +
            `**Displaying page ${page} of ${Math.ceil(totalGuilds.length / itemsPerPage)}**\n\n` +
            guildList,
          message.author,
          client,
          "server"
        );
      };

      let currentPage = 1;
      const totalPages = Math.ceil(totalGuilds.length / itemsPerPage);

      const guildListMessage = await message.reply({
        embeds: [createGuildListEmbed(currentPage)],
        components: [createButtons(currentPage, totalPages)],
      });

      const filter = (i) => i.user.id === message.author.id;
      const collector = guildListMessage.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "next_page" || i.customId === "previous_page") {
          currentPage += i.customId === "next_page" ? 1 : -1;
          await i.update({
            embeds: [createGuildListEmbed(currentPage)],
            components: [createButtons(currentPage, totalPages)],
          });
        } else if (i.customId === "leave_guild") {
          await i.reply({
            content: "Please provide the guild number you want to leave (e.g., '1').",
            ephemeral: true,
          });

          const filterMessage = (response) => response.author.id === message.author.id;
          const collectorMessage = message.channel.createMessageCollector({
            filter: filterMessage,
            time: 30000,
            max: 1,
          });

          collectorMessage.on("collect", async (response) => {
            const guildIndex = parseInt(response.content.trim(), 10) - 1;
            if (guildIndex >= 0 && guildIndex < totalGuilds.length) {
              const guildToLeave = totalGuilds[guildIndex];
              await response.reply({
                content: `You selected **${guildToLeave.name}**. Are you sure you want to make the bot leave this guild? (Yes/No)`,
                ephemeral: true,
              });

              const confirmationCollector = message.channel.createMessageCollector({
                filter: (msg) => msg.author.id === message.author.id,
                time: 30000,
                max: 1,
              });

              confirmationCollector.on("collect", async (confirmationMsg) => {
                if (confirmationMsg.content.toLowerCase() === "yes") {
                  try {
                    await guildToLeave.leave();
                    await confirmationMsg.reply({
                      content: `Successfully left the guild **${guildToLeave.name}**.`,
                      ephemeral: true,
                    });
                  } catch (err) {
                    console.error(err);
                    await confirmationMsg.reply({
                      content: `Failed to leave the guild **${guildToLeave.name}**.`,
                      ephemeral: true,
                    });
                  }
                } else {
                  await confirmationMsg.reply({
                    content: "Cancelled leaving the guild.",
                    ephemeral: true,
                  });
                }
              });
            } else {
              await response.reply({
                content: "Invalid guild number. Please provide a valid number from the list.",
                ephemeral: true,
              });
            }
          });
        } else if (i.customId === "get_invite_link") {
          await i.reply({
            content: "Please provide the guild number to fetch the invite link (e.g., '1').",
            ephemeral: true,
          });

          const filterMessage = (response) => response.author.id === message.author.id;
          const collectorMessage = message.channel.createMessageCollector({
            filter: filterMessage,
            time: 30000,
            max: 1,
          });

          collectorMessage.on("collect", async (response) => {
            const guildIndex = parseInt(response.content.trim(), 10) - 1;
            if (guildIndex >= 0 && guildIndex < totalGuilds.length) {
              const guildToFetch = totalGuilds[guildIndex];
              try {
                const channel = guildToFetch.channels.cache.find(
                  (ch) =>
                    ch.type === 0 &&
                    ch.permissionsFor(guildToFetch.members.me).has("CREATE_INSTANT_INVITE")
                );

                if (!channel) {
                  return response.reply({
                    content: `No channels found with permission to create invites in **${guildToFetch.name}**.`,
                    ephemeral: true,
                  });
                }

                const invite = await channel.createInvite({
                  maxAge: 0,
                  maxUses: 1,
                });

                await response.reply({
                  content: `Here is an invite link for **${guildToFetch.name}**: ${invite.url}`,
                  ephemeral: true,
                });
              } catch (err) {
                console.error(err);
                await response.reply({
                  content: `Failed to fetch the invite link for **${guildToFetch.name}**. Make sure I have the permission to create invites.`,
                  ephemeral: true,
                });
              }
            } else {
              await response.reply({
                content: "Invalid guild number. Please provide a valid number from the list.",
                ephemeral: true,
              });
            }
          });
        }
      });

      collector.on("end", async () => {
        await guildListMessage.edit({ components: [] });
      });
    } catch (error) {
      console.error("Error in guildlist command:", error);
      message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} An error occurred while fetching the guild list.`,
            message.author,
            client,
            "bot"
          ),
        ],
      });
    }
  },
};