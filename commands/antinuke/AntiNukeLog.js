const { PermissionsBitField } = require('discord.js');
const AntiNukeLog = require('../../database/AntiNukeLog');
const { createEmbed } = require('../../embed');
const emoji = require('../../emoji');

module.exports = {
  name: 'antinukelog',
  aliases: ["alog", "antilog","nukelogs","logs"],
  description: 'Configure anti-nuke logs',
  async execute(client, message, args) {
    const executor = message.author;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | You must be an admin to use this command.`, executor, client, null)],
      });
    }

    const subCommand = args[0]?.toLowerCase();

    if (subCommand === 'set') {
      const logChannel = message.mentions.channels.first();
      if (!logChannel) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | Please mention a valid channel.`, executor, client, null)],
        });
      }

      let logData = await AntiNukeLog.findOne({ guildId: message.guild.id });
      if (!logData) {
        logData = new AntiNukeLog({ guildId: message.guild.id, logChannelId: logChannel.id });
      } else {
        logData.logChannelId = logChannel.id;
      }

      await logData.save();

      return message.reply({
        embeds: [
          createEmbed('#00FF00', `${emoji.tick} | Anti-nuke log channel set to ${logChannel}.`, executor, client, null),
        ],
      });

    } else if (subCommand === 'reset') {
      await AntiNukeLog.findOneAndDelete({ guildId: message.guild.id });

      return message.reply({
        embeds: [
          createEmbed('#00FF00', `${emoji.tick} | Anti-nuke log channel has been reset.`, executor, client, null),
        ],
      });

    } else if (subCommand === 'show') {
      const logData = await AntiNukeLog.findOne({ guildId: message.guild.id });

      if (!logData || !logData.logChannelId) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | No anti-nuke log channel is set.`, executor, client, null)],
        });
      }

      const logChannel = message.guild.channels.cache.get(logData.logChannelId);
      return message.reply({
        embeds: [
          createEmbed('#00FF00', `${emoji.tick} | Current anti-nuke log channel is ${logChannel || 'Unknown (Channel may have been deleted)'}.`, executor, client, null),
        ],
      });
    } else {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | Usage: antinukelog set #channel / reset / show`, executor, client, null)],
      });
    }
  },
};