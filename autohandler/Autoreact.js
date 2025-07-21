const AutoReactModel = require('../database/AutoReact');
const { createEmbed } = require('../embed');
const emoji = require('../emoji');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (!message || message.author.bot || !message.guild || !message.content) return;

    const executor = message.author;

    try {
      const autoReactSetup = await AutoReactModel.findOne({ guildId: message.guild.id });
      if (!autoReactSetup || !autoReactSetup.reacts || !Array.isArray(autoReactSetup.reacts)) return;

      const contentLower = message.content.toLowerCase();

      for (const reactItem of autoReactSetup.reacts) {
        const triggerLower = reactItem.name?.toLowerCase();
        const reactEmoji = reactItem.emoji;

        if (!triggerLower || !reactEmoji) continue;

        if (contentLower.includes(triggerLower)) {
          const botMember = await message.guild.members.fetch(client.user.id);
          const botPermissions = message.channel.permissionsFor(botMember);
          if (!botPermissions || !botPermissions.has('AddReactions')) {
            return message.reply({
              embeds: [createEmbed('#FF0000', `${emoji.error} | I need **Add Reactions** permission to react.`, executor, client, null)],
            });
          }

          await message.react(reactEmoji).catch(() => {
            return message.reply({
              embeds: [createEmbed('#FF0000', `${emoji.error} | Reaction failed. Invalid or inaccessible emoji.`, executor, client, null)],
            });
          });

          break; // react once per message
        }
      }
    } catch {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | Auto-react system failed to process.`, executor, client, null)],
      });
    }
  });
};