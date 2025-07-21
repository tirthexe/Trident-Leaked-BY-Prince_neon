const { PermissionsBitField, ChannelType } = require('discord.js');
const VoiceCount = require('../../database/voicecount');
const { createEmbed } = require('../../embed');
const emoji = require('../../emoji');

module.exports = {
  name: 'voicecount',
  aliases: ['vcc'],
  description: 'Manage voice count system',
  async execute(client, message, args) {
    const executor = message.author;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | You must be an admin to use this command.`, executor, client, null)],
      });
    }

    const subCommand = args[0]?.toLowerCase();

    let vccData = await VoiceCount.findOne({ guildId: message.guild.id }) || new VoiceCount({ guildId: message.guild.id });

    if (!subCommand) {
      return message.reply({
        embeds: [
          createEmbed(
            '#00FFFF',
            `${emoji.error} | Invalid Uses Type __ Voicecount help __ For more information `,
            executor,
            client,
            null
          )
        ]
      });
    }

      // help 
      if (subCommand === 'help') {
      return message.reply({
        embeds: [
          createEmbed(
            '#00FFFF',
            `**Voice Count Command Guide** [vcc] \n\n` +
            `\`•| voicecount enable\` - Enable the message count system.\n` +
            `\`•| voicecount disable\` - Disable the message count system.\n` +
            `\`•| voicecount blacklist add <#channel/@user/categoryId/channelId/userId>\` - Add to blacklist.\n` +
            `\`•| voicecount blacklist remove <#channel/@user/categoryId/channelId/userId>\` - Remove from blacklist.\n` +
            `\`•| voicecount blacklist reset\` - Reset the blacklist.\n` +
            `\`•| voicecount blacklist list\` - Show the current blacklist.\n` +
            `\`•| voicecount help\` - Show this help message.\n\n` + 
            ` **__ voice INFO COMMAND __** [v] \n\n` + 
            `\` •| voice <@user/ id >\` - To get information about a user's messages.\n` + 
            `\` •| voice add <@user/id>\` - To add  messages to a user\n` +
            `\` •| voice remove <@user/id>\` - To remove messages to a user\n` + 
            `\` •| voice reset <@user/all>\` - Reset all messages from user or all server\n\n` + 
             ` ** __ LEADERBOARD COMMANDS [lb] __** \n\n` +
             `\` •| lbday messages \` - Show daily top users.\n` + 
              `\` •| lbweek messages \` - show weekly top users.\n` + 
             `\` •| lbmonth messages \` - Show monthly top users.\n` + 
             `\` •| lb messages \` - show all time top users.\n`,
            executor,
            client,
            null
          )
        ]
      });
      }
      
    // ✅ ENABLE / DISABLE
    if (subCommand === 'enable' || subCommand === 'disable') {
      vccData.enable = subCommand === 'enable';
      await vccData.save();
      return message.reply({
        embeds: [createEmbed('#00FF00', `${emoji.tick} | Voice Count has been ${subCommand}d.`, executor, client, null)]
      });
    }

    // ✅ BLACKLIST HANDLER
    if (subCommand === 'blacklist' || subCommand === 'bl') {
      const action = args[1]?.toLowerCase();
      const target = args[2];

      if (!['add', 'remove', 'reset', 'list'].includes(action)) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | Usage: vcc blacklist add/remove/reset/list <target>`, executor, client, null)]
        });
      }

      // LIST
if (action === 'list') {
  const formatList = (arr, type) => {
    if (arr.length === 0) return 'None';
    return arr.map(id => {
      if (type === 'channels') return `<#${id}>`;
      if (type === 'users') return `<@${id}>`;
      return `\`${id}\``; // categories
    }).join(', ');
  };

  return message.reply({
    embeds: [
      createEmbed(
        '#00FFFF',
        `**Voice Count Blacklist:**\n\n` +
        `**Channels:** ${formatList(vccData.blacklist.channels, 'channels')}\n` +
        `**Categories:** ${formatList(vccData.blacklist.categories, 'categories')}\n` +
        `**Users:** ${formatList(vccData.blacklist.users, 'users')}`,
        executor,
        client,
        null
      )
    ]
  });
}

      // RESET
      if (action === 'reset') {
        vccData.blacklist.channels = [];
        vccData.blacklist.categories = [];
        vccData.blacklist.users = [];
        await vccData.save();

        return message.reply({
          embeds: [createEmbed('#00FF00', `${emoji.tick} | All blacklist entries have been reset.`, executor, client, null)]
        });
      }

      if (!target) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | Please mention a user/channel or provide a valid ID.`, executor, client, null)]
        });
      }

      const id = target.replace(/[<@#&>]/g, '');
const channel = message.guild.channels.cache.get(id);
const member = message.guild.members.cache.get(id);
const category = message.guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.id === id);

let type = null;

if (member) {
  type = 'users';
} else if (channel && (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice)) {
  type = 'channels';
} else if (category) {
  type = 'categories';
} else {
  return message.reply({
    embeds: [createEmbed('#FF0000', `${emoji.error} | Please provide a valid user, voice/stage channel, or category.`, executor, client, null)]
  });
}

      if (action === 'add') {
        if (vccData.blacklist[type].includes(id)) {
          return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | This ID is already blacklisted.`, executor, client, null)] });
        }
        vccData.blacklist[type].push(id);
      } else if (action === 'remove') {
        if (!vccData.blacklist[type].includes(id)) {
          return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | This ID is not in the blacklist.`, executor, client, null)] });
        }
        vccData.blacklist[type] = vccData.blacklist[type].filter(i => i !== id);
      }

      await vccData.save();
      return message.reply({
        embeds: [createEmbed('#00FF00', `${emoji.tick} | Blacklist ${action}ed successfully from **${type}**.`, executor, client, null)]
      });
    }
  }
};