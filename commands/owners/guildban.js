const GuildBan = require("../../database/guildban");
const { ownerID } = require("../../owner");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "guildban",
  description: "Manages the list of banned guilds (Owner only).",
  async execute(client, message, args) {
    try {
      // Check if the user is the bot owner
      if (message.author.id !== ownerID) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} You can't use this command.`,
              message.author,
              client,
              null
            ),
          ],
        });
      }

      const subCommand = args[0]?.toLowerCase();
      const guildId = args[1];

      // Subcommand: Add
      if (subCommand === "add") {
        if (!guildId) {
          return message.reply({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} Please provide a guild ID to ban.`,
                message.author,
                client,
                null
              ),
            ],
          });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          return message.reply({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} Guild with ID **${guildId}** not found.`,
                message.author,
                client,
                null
              ),
            ],
          });
        }

        // Add guild to the database
        await GuildBan.create({ guildId, guildName: guild.name });

        // Leave the guild
        await guild.leave();

        return message.reply({
          embeds: [
            createEmbed(
              "#00FF00",
              `${emoji.tick} Successfully banned **${guild.name}** and left the guild.`,
              message.author,
              client,
              null
            ),
          ],
        });
      }

      // Subcommand: Remove
      if (subCommand === "remove") {
        if (!guildId) {
          return message.reply({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} Please provide a guild ID to unban.`,
                message.author,
                client,
                null
              ),
            ],
          });
        }

        // Remove guild from the database
        const result = await GuildBan.findOneAndDelete({ guildId });
        if (!result) {
          return message.reply({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} Guild with ID **${guildId}** is not banned.`,
                message.author,
                client,
                null
              ),
            ],
          });
        }

        return message.reply({
          embeds: [
            createEmbed(
              "#00FF00",
              `${emoji.tick} Successfully unbanned the guild with ID **${guildId}**.`,
              message.author,
              client,
              null
            ),
          ],
        });
      }

      // Subcommand: List
      if (subCommand === "list") {
        const bannedGuilds = await GuildBan.find();
        if (bannedGuilds.length === 0) {
          return message.reply({
            embeds: [
              createEmbed(
                "#FFFF00",
                `${emoji.info} No guilds are currently banned.`,
                message.author,
                client,
                null
              ),
            ],
          });
        }

        const list = bannedGuilds
          .map((g, i) => `\`${i + 1}.\` **${g.guildName}** (ID: ${g.guildId})`)
          .join("\n");

        return message.reply({
          embeds: [
            createEmbed(
              "#00FFFF",
              `**Banned Guilds:**\n${list}`,
              message.author,
              client,
              null
            ),
          ],
        });
      }

      // Invalid Subcommand
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} Invalid subcommand. Use \`add\`, \`remove\`, or \`list\`.`,
            message.author,
            client,
            null
          ),
        ],
      });
    } catch (error) {
      console.error("Error in guildban command:", error);
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} An error occurred while managing the banned guilds.`,
            message.author,
            client,
            null
          ),
        ],
      });
    }
  },
};