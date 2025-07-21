const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");
const { ownerID } = require("../../owner");

module.exports = {
  name: "globalban",
  description: "Ban a user globally from all guilds the bot is in (Owner only).",
  async execute(client, message, args) {
    try {
      // Permission check
      if (message.author.id !== ownerID) return;

      // Fetch user to ban
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
              `${emoji.error} You cannot globally ban yourself.`,
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
            `${emoji.info} Attempting to globally ban **${target.tag}** from all guilds...`,
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
          const member = await guild.members.fetch(target.id).catch(() => null);
          if (member) {
            await member.ban({ reason: "User has been globally banned due to repeated and severe violations of Discord's terms of service, including but not limited to harassment, nuking, spamming, distributing malicious content, and engaging in activities that undermine the safety and well-being of the Discord community. This global ban is a result of a pattern of behavior that is deemed unacceptable, and it is necessary to ensure the integrity and security of multiple servers on the platform." });
            await message.channel.send(`Banned **${target.tag}** from **${guild.name}**.`);
          }
        } catch {
          // Ignore errors silently if banning fails
        }
      }

      // Final message
      message.channel.send(`Global ban process completed 🏅.`);
    } catch (error) {
      console.error("Error in globalban command:", error);
      message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} An error occurred while executing the global ban.`,
            message.author,
            client,
            "bot"
          ),
        ],
      });
    }
  },
};