const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");
const { ownerID } = require("../../owner");

module.exports = {
  name: "globalunban",
  description: "Unban a user globally from all guilds the bot is in (Owner only).",
  async execute(client, message, args) {
    try {
      // Permission check: If not owner, silently do nothing
      if (message.author.id !== ownerID) return;

      // Fetch user to unban
      const target =
        message.mentions.users.first() || (await client.users.fetch(args[0]).catch(() => null));

      if (!target) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} Please mention a valid user or provide their user ID.`,
              message.author,
              client,
              "user"
            ),
          ],
        });
      }

      if (target.id === ownerID) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} You cannot globally unban yourself.`,
              message.author,
              client,
              "user"
            ),
          ],
        });
      }

      // Notify starting process
      message.reply({
        embeds: [
          createEmbed(
            "#5865F2",
            `${emoji.info} Attempting to globally unban **${target.tag}** from all guilds...`,
            message.author,
            client,
            "bot"
          ),
        ],
      });

      // Get all guilds the bot is in
      const totalGuilds = Array.from(client.guilds.cache.values());

      for (const guild of totalGuilds) {
        try {
          const bans = await guild.bans.fetch();
          if (bans.has(target.id)) {
            await guild.members.unban(target.id, "Global unban by bot owner");
            await message.channel.send(`Unbanned **${target.tag}** from **${guild.name}**.`);
          }
        } catch {
          // Ignore errors silently if unbanning fails
        }
      }

      // Final message
      message.channel.send(`Global unban process completed 🏅.`);
    } catch (error) {
      console.error("Error in globalunban command:", error);
      message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} An error occurred while executing the global unban.`,
            message.author,
            client,
            "bot"
          ),
        ],
      });
    }
  },
};