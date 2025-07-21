const { createEmbed } = require('../../embed');
const emoji = require('../../emoji');
const AFK = require('../../database/AFK');

module.exports = {
  name: 'afk',
  description: 'Set your AFK status.',
  async execute(client, message, args) {
    const executor = message.author;

    const reason = args.join(' ') || 'No reason provided.';
    const timestamp = Date.now();

    // Save AFK status to the database
    await AFK.findOneAndUpdate(
      { userId: executor.id, guildId: message.guild.id },
      { userId: executor.id, guildId: message.guild.id, reason, timestamp },
      { upsert: true }
    );

    return message.reply({
      embeds: [
        createEmbed(
          '#00FF00',
          `${emoji.tick} | ** You are now marked as AFK.** \n\n**Reason:** ${reason}`,
          executor,
          client,
          null
        ),
      ],
    });
  },
};