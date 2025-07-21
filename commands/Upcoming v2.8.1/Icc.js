const { PermissionsBitField } = require('discord.js');
const InviteCount = require('../../database/invitecount');
const { createEmbed } = require('../../embed');
const emoji = require('../../emoji');

module.exports = {
  name: 'invitecount',
  aliases: ['ic'],
  description: 'Manage invite count system',
  async execute(client, message, args) {
    const executor = message.author;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | You must be an admin to use this command.`, executor, client, null)],
      });
    }

    const subCommand = args[0]?.toLowerCase();
    let icData = await InviteCount.findOne({ guildId: message.guild.id }) || new InviteCount({ guildId: message.guild.id });

    if (!subCommand || subCommand === 'help') {
      return message.reply({
        embeds: [
          createEmbed(
            '#00FFFF',
            `**Invite Count Command Guide**\n\n` +
            `\`•| ic enable/disable\` - Enable or disable the invite count system.\n`,
            executor,
            client,
            null
          )
        ]
      });
    }

    // ✅ ENABLE / DISABLE
    if (subCommand === 'enable' || subCommand === 'disable') {
      icData.enable = subCommand === 'enable';
      await icData.save();
      return message.reply({
        embeds: [createEmbed('#00FF00', `${emoji.tick} | Invite Count has been ${subCommand}d.`, executor, client, null)]
      });
    }

    // ❌ Unknown subcommand
    return message.reply({
      embeds: [createEmbed('#FF0000', `${emoji.error} | Unknown subcommand. Use \`ic help\` to see available options.`, executor, client, null)]
    });
  }
};