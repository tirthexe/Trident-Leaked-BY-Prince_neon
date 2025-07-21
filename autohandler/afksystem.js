const { createEmbed } = require('../embed');
const emoji = require('../emoji');
const AFK = require('../database/AFK');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (!message || message.author.bot || !message.guild) return;

    const executor = message.author;

    // Check mentions for AFK users
    if (message.mentions.members.size > 0) {
      const mentioned = message.mentions.members.first();
      const afkData = await AFK.findOne({ userId: mentioned.id, guildId: message.guild.id });

      if (afkData) {
        return message.reply({
          embeds: [
            createEmbed(
              '#00FF00',
              `${emoji.anvi} | **${mentioned.user.username}** went AFK <t:${Math.floor(
                afkData.timestamp / 1000
              )}:R>\n**Reason:** ${afkData.reason || 'No reason provided.'}`,
              executor,
              client,
              null
            ),
          ],
        });
      }
    }

    // Remove AFK status if the user sends a message
    const afkUser = await AFK.findOne({ userId: message.author.id, guildId: message.guild.id });

    if (afkUser) {
      await AFK.deleteOne({ userId: message.author.id, guildId: message.guild.id });

      return message.reply({
        embeds: [
          createEmbed(
            '#00FF00',
            `${emoji.tick} |  Welcome back, **${message.author.username}**! Your AFK status has been removed.`,
            executor,
            client,
            null
          ),
        ],
      });
    }
  });
};