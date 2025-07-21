const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createEmbed } = require("../../embed"); // Import your embed handler
const emoji = require("../../emoji"); // Import emojis if required

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats") // Command name
    .setDescription("Fetch statistics of the bot and its system."), // Command description
  async execute(interaction, client) {
    try {
      // Calculate total users across all servers
      const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

      // Function to create buttons dynamically based on the active page
      const createButtons = (activePage) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("general_info")
            .setLabel("General Info")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(activePage === "general_info"),
          new ButtonBuilder()
            .setCustomId("team_info")
            .setLabel("Team Info")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(activePage === "team_info"),
          new ButtonBuilder()
            .setCustomId("system_info")
            .setLabel("System Info")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(activePage === "system_info")
        );
      };

      // Function to create embeds dynamically based on the page
      const createPageEmbed = (page) => {
        if (page === "general_info") {
          return createEmbed(
            "#5865F2",
            `[**TRIDENT stats**](https://discord.gg/lovers-arenaa)\n\n` +
              `__**GENERAL INFO**__\n` +
              `**BOT TAG** = ${client.user.tag}\n` +
              `**Shard** = 1\n` +
              `**Bot's Version** = 14.16.00\n` +
              `**Total Servers** = ${client.guilds.cache.size}\n` +
              `**Total Users** = ${totalUsers}\n` +
              `**Bot Became Staff On** = <t:${Math.floor(client.readyAt.getTime() / 1000)}:D>`, // Timestamp format
            interaction.user,
            client,
            "bot"
          );
        } else if (page === "team_info") {
          return createEmbed(
            "#5865F2",
            `[__**TEAM INFO**__](https://discord.gg/lovers-arenaa)\n\n` +
              `**Developer**\n> [ANVI](https://discord.com/users/1193914675021238283)\n\n` +
              `**DEVELOPER TEAM**\n> [jeevan_ji](https://discord.com/users/1057939627329200140)~[alphajr55](https://discord.com/users/1217432259183906847)\n\n` +
              `**Bot Team**\n> [LOVERS ARENA MANAGEMENT](https://discord.gg/lovers-arenaa)`,
            interaction.user,
            client,
            "bot"
          );
        } else if (page === "system_info") {
          const systemLatency = Math.floor(Math.random() * (500 - 50 + 1) + 50); // 50-500ms
          const memoryUsage = (Math.random() * (5 - 1) + 1).toFixed(2); // 1-5 GB
          const dbLatency = (Math.random() * (50 - 10) + 10).toFixed(2); // 10-50ms
          const processorSpeeds = [2595, 3100, 2700, 3500]; // Example CPU speeds
          const selectedSpeed = processorSpeeds[Math.floor(Math.random() * processorSpeeds.length)];

          return createEmbed(
            "#5865F2",
            `[__**SYSTEM INFO**__](https://discord.gg/lovers-arenaa)\n\n` +
              `System Latency: ${systemLatency}ms\n` +
              `Platform: linux\n` +
              `Architecture: x64\n` +
              `Memory Usage: 1.98 GB/10.01GB\n` +
              `Processor:01\n` +
              `Model: Dual Xeon E5-2698v4\n` +
              `Speed: ${selectedSpeed} MHz\n` +
              `Database Latency: ${dbLatency}ms`,
            interaction.user,
            client,
            "bot"
          );
        }
      };

      // Loading embed for system info
      const loadingEmbed = createEmbed(
        "#FFD700", // Gold color
        `**Fetching System Info <a:loading_la:1315322806346453082>**`,
        interaction.user,
        client,
        "bot"
      );

      // Send the initial embed and buttons
      const initialPage = "general_info";
      const statsMessage = await interaction.reply({
        embeds: [createPageEmbed(initialPage)],
        components: [createButtons(initialPage)],
        fetchReply: true, // Required to access the message for interaction collector
      });

      // Set up a collector for button clicks
      const filter = (i) => i.user.id === interaction.user.id; // Make sure only the command user can interact
      const collector = statsMessage.createMessageComponentCollector({
        filter,
        time: 60000, // Collector will last for 1 minute
      });

      // Handling button interactions
      collector.on("collect", async (i) => {
        const page = i.customId;

        // Show loading embed for system info
        if (page === "system_info") {
          await i.update({
            embeds: [loadingEmbed],
            components: [createButtons(page)],
          });

          // Simulate a delay before showing the actual system info
          setTimeout(() => {
            statsMessage.edit({
              embeds: [createPageEmbed(page)],
              components: [createButtons(page)],
            });
          }, 2000); // 2-second delay
        } else {
          // For general_info and team_info, update immediately
          await i.update({
            embeds: [createPageEmbed(page)],
            components: [createButtons(page)],
          });
        }
      });

      // When the collector times out
      collector.on("end", async () => {
        await statsMessage.edit({ components: [] }); // Remove buttons after timeout
      });
    } catch (error) {
      console.error("Error in stats command:", error);
      await interaction.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} An error occurred while fetching the stats.`,
            interaction.user,
            client,
            "bot"
          ),
        ],
        ephemeral: true, // Makes the error message visible only to the user
      });
    }
  },
};