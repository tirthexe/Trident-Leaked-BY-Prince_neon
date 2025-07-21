const { PermissionsBitField, ChannelType } = require('discord.js');
const MessageCount = require('../../database/messagecount');
const { createEmbed } = require('../../embed');
const emoji = require('../../emoji');

module.exports = {
  name: 'messagecount',
  aliases: ['mcc', 'messagescount','mcount'],
  description: 'Manage message count system',
  async execute(client, message, args) {
    const executor = message.author;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | You must be an admin to use this command.`, executor, client, null)],
      });
    }

    const subCommand = args[0]?.toLowerCase();

    let mccData = await MessageCount.findOne({ guildId: message.guild.id }) || new MessageCount({ guildId: message.guild.id });

    if (!subCommand) {
      return message.reply({
        embeds: [
          createEmbed(
            '#00FFFF',
            `${emoji.error} | Invalid uses type __ Messagescount help __ for more information `,
            executor,
            client,
            null
          )
        ]
      });
    }
    
      //help
      if (subCommand === 'help') {
      return message.reply({
        embeds: [
          createEmbed(
            '#00FFFF',
            `**Message Count Command Guide** [mcc] \n\n` +
            `\`•| messagescount enable\` - Enable the message count system.\n` +
            `\`•| messagescount disable\` - Disable the message count system.\n` +
            `\`•| messagescount blacklist add <#channel/@user/categoryId/channelId/userId>\` - Add to blacklist.\n` +
            `\`•| messagescount blacklist remove <#channel/@user/categoryId/channelId/userId>\` - Remove from blacklist.\n` +
            `\`•| messagescount blacklist reset\` - Reset the blacklist.\n` +
            `\`•| messagescount blacklist list\` - Show the current blacklist.\n` +
            `\`•| messagescount help\` - Show this help message.\n\n` + 
            ` **__ MESSAGES INFO COMMAND __** [m]  \n\n` + 
            `\` •| messages <@user/ id >\` - To get information about a user's messages.\n` + 
            `\` •| messages add <@user/id>\` - To add  messages to a user\n` +
            `\` •| messages remove <@user/id>\` - To remove messages to a user\n` + 
            `\` •| messages reset <@user/all>\` - Reset all messages from user or all server\n\n` + 
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
      mccData.enable = subCommand === 'enable';
      await mccData.save();
      return message.reply({
        embeds: [createEmbed('#00FF00', `${emoji.tick} | Message Count has been ${subCommand}d.`, executor, client, null)]
      });
    }

    // ✅ BLACKLIST HANDLER
    if (subCommand === 'blacklist' || subCommand === 'bl') {
      const action = args[1]?.toLowerCase();
      const target = args[2];

      if (!['add', 'remove', 'reset', 'list'].includes(action)) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | Usage: mcc blacklist add/remove/reset/list <target>`, executor, client, null)]
        });
      }

      // LIST
      if (action === 'list') {
        const formatList = (arr, type) => {
  if (!arr.length) return 'None';
  return arr.map(id => {
    if (type === 'channels' || type === 'categories') return `<#${id}>`;
    if (type === 'users') return `<@${id}>`;
    return `\`${id}\``;
  }).join(', ');
};

        return message.reply({
          embeds: [
            createEmbed(
              '#00FFFF',
              `**Message Count Blacklist:**\n\n` +
              `**Channels:** ${formatList(mccData.blacklist.channels, 'channels')}\n` +
`**Categories:** ${formatList(mccData.blacklist.categories, 'categories')}\n` +
`**Users:** ${formatList(mccData.blacklist.users, 'users')}\n` ,
              executor,
              client,
              null
            )
          ]
        });
      }  
      // RESET
      if (action === 'reset') {
        mccData.blacklist.channels = [];
        mccData.blacklist.categories = [];
        mccData.blacklist.users = [];
        await mccData.save();

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

      let type = null;

if (channel) {
  type = channel.type === ChannelType.GuildCategory ? 'categories' : 'channels';
} else if (member) {
  type = 'users';
} else {
  return message.reply({
    embeds: [
      createEmbed('#FF0000', `${emoji.error} | Invalid target. Please mention a valid user, channel, or category.`, executor, client, null)
    ]
  });
}

      if (action === 'add') {
        if (mccData.blacklist[type].includes(id)) {
          return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | This ID is already blacklisted.`, executor, client, null)] });
        }
        mccData.blacklist[type].push(id);
      } else if (action === 'remove') {
        if (!mccData.blacklist[type].includes(id)) {
          return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | This ID is not in the blacklist.`, executor, client, null)] });
        }
        mccData.blacklist[type] = mccData.blacklist[type].filter(i => i !== id);
      }

      await mccData.save();
      return message.reply({
        embeds: [createEmbed('#00FF00', `${emoji.tick} | Blacklist ${action}ed successfully from **${type}**.`, executor, client, null)]
      });
    }
  }
};