const { PermissionsBitField, ChannelType } = require('discord.js');
const SlotSetup = require('../../database/SlotSetup');
const { createEmbed } = require('../../embed');
const emoji = require('../../emoji');

module.exports = {
  name: 'slot',
  aliases: ["s"],
  description: 'Manage slot system',
  async execute(client, message, args) {
    const executor = message.author;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [createEmbed('#FF0000', `${emoji.error} | You must be an admin to use this command.`, executor, client, null)],
      });
    }

    const subCommand = args[0]?.toLowerCase();
    if (!subCommand) {
      return message.reply({
        embeds: [
          createEmbed(
            '#00FFFF',
            `**Slot Command Guide**\n\n` +
              `\`•| slot category add/remove <category ID>\` - Manage categories (max 3).\n` +
              `\`•| slot role add/remove <role ID/mention>\` - Assign the slot role.\n` +
              `\`•| slot add @user <category> <ping count> <duration>\` - Assign a slot.\n` +
              `\`•| slot revoke @user\` - Revoke a user's slot.\n` +
              `\`•| slotuser @user \` - information about slot user.\n` +
              `\`•| slotinfo \` - information about server slots.\n` +
              `\`•| slotping add/remove @user  <ping amount>\` - Add/remove extra Pings.\n`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    let slotData = await SlotSetup.findOne({ guildId: message.guild.id }) || new SlotSetup({ guildId: message.guild.id });

    // ✅ SLOT CATEGORY ADD/REMOVE
    if (subCommand === 'category') {
      const action = args[1]?.toLowerCase();
      const categoryId = args[2];

      if (!['add', 'remove'].includes(action) || !categoryId) {
        return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | Usage: slot category add/remove <category ID>`, executor, client, null)] });
      }

      if (action === 'add') {
        if (slotData.categories.length >= 3) return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | Only 3 categories allowed.`, executor, client, null)] });
        slotData.categories.push(categoryId);
      } else {
        slotData.categories = slotData.categories.filter(id => id !== categoryId);
      }

      await slotData.save();
      return message.reply({ embeds: [createEmbed('#00FF00', `${emoji.tick} | Slot category ${action}ed successfully!`, executor, client, null)] });
    }

    // ✅ SLOT ROLE ADD/REMOVE
    if (subCommand === 'role') {
      const action = args[1]?.toLowerCase();
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);

      if (!['add', 'remove'].includes(action) || !role) {
        return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | Usage: slot role add/remove <role ID/mention>`, executor, client, null)] });
      }

      slotData.slotRole = action === 'add' ? role.id : null;
      await slotData.save();
      return message.reply({ embeds: [createEmbed('#00FF00', `${emoji.tick} | Slot role ${action}ed successfully!`, executor, client, null)] });
    }

    // ✅ SLOT ADD
    if (subCommand === 'add') {
      const user = message.mentions.users.first();
      const categoryIndex = parseInt(args[2]) - 1;
      const ping = args[3];
      const duration = args[4];

      if (!user || isNaN(categoryIndex) || !ping || !duration || !slotData.categories[categoryIndex]) {
        return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | Invalid command usage.`, executor, client, null)] });
      }

      const expirationTime = new Date();
      const timeValue = parseInt(duration.slice(0, -1));
      const timeUnit = duration.slice(-1);
      if (!['d', 'm', 'y'].includes(timeUnit) || isNaN(timeValue)) {
        return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | Invalid duration format! Use 1d (day), 1m (month), 1y (year).`, executor, client, null)] });
      }
      if (timeUnit === 'd') expirationTime.setDate(expirationTime.getDate() + timeValue);
      if (timeUnit === 'm') expirationTime.setMonth(expirationTime.getMonth() + timeValue);
      if (timeUnit === 'y') expirationTime.setFullYear(expirationTime.getFullYear() + timeValue);

      const category = slotData.categories[categoryIndex];
      const categoryChannel = message.guild.channels.cache.get(category);
      if (!categoryChannel) {
        return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | Invalid category Number.`, executor, client, null)] });
      }

      const overwrites = categoryChannel.permissionOverwrites.cache.map(perm => ({
        id: perm.id,
        allow: perm.allow,
        deny: perm.deny,
      }));

      overwrites.push(
        { id: user.id, allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.MentionEveryone] }
      );

      const channel = await message.guild.channels.create({
        name: `🤖-${user.username}-slot`,
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: overwrites,
      });

      slotData.slots.push({
        userId: user.id,
        channelId: channel.id,
        pingCount: ping,
        activatedAt: Date.now(),
        expiration: expirationTime.getTime(),
      });

      await slotData.save();
      if (slotData.slotRole) {
        await message.guild.members.cache.get(user.id)?.roles.add(slotData.slotRole);
      }

      const activatedAt = Math.floor(Date.now() / 1000);
      const expiresAt = Math.floor(expirationTime.getTime() / 1000);

      await channel.send({
        embeds: [
          createEmbed(
            '#FF0000',
            `**__Slot Rules__**\n\n` +
              `- **${ping} here pings per day**\n` +
              `- **No everyone ping**\n` +
              `- **More than ${ping} pings, revoked!**\n` +
              `- **No DM promotion allowed**\n` +
              `- **No refunds after payment**\n` +
              `- **Breaking server rules = revoke + no refund**\n` +
              `- **Ping reset time based on (USI) **\n` +
              `- **Scam = revoke + ban**\n` +
              `- **Disrespecting server owners/staff = revoke**\n` +
              `- **Slot sharing or selling not allowed**\n` +
              `- **No NSFW selling/buying allowed**\n\n` +
              `> **Slot User:** ${user}\n` +
              `> **Ping Limit:** ${ping}\n` +
              `> **Activated At:** <t:${activatedAt}:F>\n` +
              `> **Expires At:** <t:${expiresAt}:F>`,
            executor,
            client,
            null
          ),
        ],
      });

      return message.reply({ embeds: [createEmbed('#00FF00', `${emoji.tick} | Slot assigned to ${user}.`, executor, client, null)] });
    }

    // ✅ SLOT REVOKE
    if (subCommand === 'revoke') {
      const user = message.mentions.users.first();
      if (!user) return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | Mention a user to revoke slot.`, executor, client, null)] });

      const slot = slotData.slots.find(s => s.userId === user.id);
      if (!slot) return message.reply({ embeds: [createEmbed('#FF0000', `${emoji.error} | User has no slot.`, executor, client, null)] });

      await message.guild.channels.cache.get(slot.channelId)?.delete();
      slotData.slots = slotData.slots.filter(s => s.userId !== user.id);
      if (slotData.slotRole) await message.guild.members.cache.get(user.id)?.roles.remove(slotData.slotRole);
      await slotData.save();

      return message.reply({ embeds: [createEmbed('#00FF00', `${emoji.tick} | Slot revoked from ${user}.`, executor, client, null)] });
    }
  },
};