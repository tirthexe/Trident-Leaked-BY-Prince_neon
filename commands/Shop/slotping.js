const { PermissionsBitField } = require('discord.js');
const SlotSetup = require('../../database/SlotSetup');
const { createEmbed } = require('../../embed');
const emoji = require('../../emoji');

module.exports = {
  name: 'slotping',
  aliases:["sp","sping"],
  description: 'Add or remove pings for a slot user',
  async execute(client, message, args) {
    const executor = message.author;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | You must be an admin to use this command.`, executor, client, null)],
      });
    }

    const action = args[0]?.toLowerCase();
    const user = message.mentions.users.first();
    const pingCount = parseInt(args[2], 10); // Explicit base 10 parsing

    if (!['add', 'remove'].includes(action) || !user || isNaN(pingCount) || pingCount <= 0) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | Usage: ping add/remove @user <ping count>`, executor, client, null)],
      });
    }

    let slotData = await SlotSetup.findOne({ guildId: message.guild.id });
    if (!slotData) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | No slot setup found in this server.`, executor, client, null)],
      });
    }

    let slotUser = slotData.slots.find(s => s.userId === user.id);
    if (!slotUser) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | This user does not have a slot. Please assign a slot first.`, executor, client, null)],
      });
    }

    let previousPing = Number(slotUser.pingCount || 0); // Ensure numeric handling
    let updatedPing = previousPing;

    if (action === 'add') {
      updatedPing = previousPing + pingCount;

      // Fetch the user's slot channel and update permissions
      const slotChannel = message.guild.channels.cache.get(slotUser.channelId);
      if (slotChannel) {
        await slotChannel.permissionOverwrites.edit(user.id, {
          MentionEveryone: true, // Allow mentioning @everyone
        });
      }
    } else {
      if (pingCount > previousPing) {
        return message.reply({
          embeds: [createEmbed('#FF0000', `${emoji.error} | User has only \`${previousPing}\` pings. You cannot remove \`${pingCount}\` pings.`, executor, client, null)],
        });
      }
      updatedPing = previousPing - pingCount;
    }

    slotUser.pingCount = updatedPing;
    await slotData.save();

    return message.reply({
      embeds: [
        createEmbed(
          '#00FF00',
          `${emoji.tick} | Successfully **${action}ed** \`${pingCount}\` pings for ${user}.\n\n` +
            `> **Previous Pings:** \`${previousPing}\`\n` +
            `> **Updated Pings:** \`${updatedPing}\``,
          executor,
          client,
          null
        ),
      ],
    });
  },
};