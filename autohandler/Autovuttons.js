const {
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType
} = require('discord.js');
const AutoVoiceSetup = require('../database/AutoVoiceSetup');

module.exports = (client) => {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const id = interaction.customId;
    if (!id.startsWith('tr_')) return;

    const parts = id.split('_');
    const action = parts[1];

    const userChannel = interaction.member.voice?.channel;

    const dbData = await AutoVoiceSetup.findOne({
      customVoiceChannels: {
        $elemMatch: { channelId: userChannel?.id }
      }
    });

    const voiceChannelId = dbData?.voiceChannelId || 'Generator voice channel ';

    if (!userChannel) {
      const embed = new EmbedBuilder()
        .setDescription(`You are not in a voice channel.\nJoin **${voiceChannelId}** to create your custom voice.`)
        .setColor('Red');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (!dbData) {
      const embed = new EmbedBuilder()
        .setDescription(`Your voice channel is not registered in the system.`)
        .setColor('Red');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const customChannel = dbData.customVoiceChannels.find(vc => vc.channelId === userChannel.id);

    if (!customChannel || customChannel.ownerId !== interaction.user.id) {
      const embed = new EmbedBuilder()
        .setDescription(`You are not the owner of this voice channel.`)
        .setColor('Red');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      switch (action) {
        case 'Lock':
          await userChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: false });
          return interaction.reply({ embeds: [new EmbedBuilder().setDescription('**Your Channel has been locked for everyone **.').setColor('Green')], ephemeral: true });

        case 'Unlock':
          await userChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: true });
          return interaction.reply({ embeds: [new EmbedBuilder().setDescription('**Your Channel has been unlocked For everyone **.').setColor('Green')], ephemeral: true });

        case 'Hide':
          await userChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false });
          return interaction.reply({ embeds: [new EmbedBuilder().setDescription('** Your Channel has been hidden for everyone**.').setColor('Green')], ephemeral: true });

        case 'Unhide':
          await userChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: true });
          return interaction.reply({ embeds: [new EmbedBuilder().setDescription('**Your Channel has veen visible for everyone**.').setColor('Green')], ephemeral: true });

        case 'Mute':
        case 'Unmute':
        case 'Kick': {
          const members = [...userChannel.members.values()].filter(m => m.id !== interaction.user.id);
          if (members.length === 0) {
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription('**No other users in the VC.**').setColor('Red')], ephemeral: true });
          }

          const options = members.map(member => ({
            label: member.user.username,
            value: member.id,
          }));

          const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`avselect_${action}_${userChannel.id}`)
              .setPlaceholder(`Select users to ${action.toLowerCase()}`)
              .addOptions(options)
          );

          return interaction.reply({
            embeds: [new EmbedBuilder().setDescription(`Select users to **${action.toLowerCase()}**:`).setColor('Blue')],
            components: [selectMenu],
            ephemeral: true,
          });
        }

        case 'Rename': {
          const modal = new ModalBuilder()
            .setCustomId(`avrename_${userChannel.id}`)
            .setTitle('** Successfull Rename your Voice Channel **');

          const nameInput = new TextInputBuilder()
            .setCustomId('newChannelName')
            .setLabel('Enter new voice channel name')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(32)
            .setRequired(true);

          const row = new ActionRowBuilder().addComponents(nameInput);
          modal.addComponents(row);

          return await interaction.showModal(modal);
        }

        case 'Delete':
          await userChannel.delete().catch(() => {});
          await AutoVoiceSetup.updateOne(
            { _id: dbData._id },
            { $pull: { customVoiceChannels: { channelId: userChannel.id } } }
          );
          return interaction.reply({ embeds: [new EmbedBuilder().setDescription('Channel deleted.').setColor('Green')], ephemeral: true });

        case 'Info':
          const infoEmbed = new EmbedBuilder()
            .setTitle('Voice Channel Info')
            .addFields(
              { name: 'Channel Name', value: userChannel.name, inline: true },
              { name: 'Owner', value: `<@${customChannel.ownerId}>`, inline: true },
            )
            .setColor('Blue')
            .setFooter({ text: 'Trident AutoVoice System' });

          return interaction.reply({ embeds: [infoEmbed], ephemeral: true });

        case 'Bit': {
          const modal = new ModalBuilder()
            .setCustomId(`avbitform_${userChannel.id}`)
            .setTitle('Set Bitrate');

          const bitrateInput = new TextInputBuilder()
            .setCustomId('bitrateValue')
            .setLabel('Enter bitrate (8000 - 96000)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const row = new ActionRowBuilder().addComponents(bitrateInput);
          modal.addComponents(row);

          return await interaction.showModal(modal);
        }

        case 'User': {
          const modal = new ModalBuilder()
            .setCustomId(`avuserlimit_${userChannel.id}`)
            .setTitle('**Set User Limit**');

          const limitInput = new TextInputBuilder()
            .setCustomId('userLimit')
            .setLabel('Enter max users (0 for unlimited)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const row = new ActionRowBuilder().addComponents(limitInput);
          modal.addComponents(row);

          return await interaction.showModal(modal);
        }

        default:
          return interaction.reply({ embeds: [new EmbedBuilder().setDescription('Invalid action.').setColor('Red')], ephemeral: true });
      }
    } catch (err) {
      console.error(err);
      return interaction.reply({ embeds: [new EmbedBuilder().setDescription('Something went wrong.').setColor('Red')], ephemeral: true });
    }
  });

  client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    if (!interaction.customId.startsWith('avselect_')) return;

    const [_, action, channelId] = interaction.customId.split('_');
    const userChannel = interaction.member.voice?.channel;

    if (!userChannel || userChannel.id !== channelId) {
      return interaction.reply({ embeds: [new EmbedBuilder().setDescription('You are not in the correct VC.').setColor('Red')], ephemeral: true });
    }

    const dbData = await AutoVoiceSetup.findOne({
      customVoiceChannels: { $elemMatch: { channelId } }
    });

    const customChannel = dbData?.customVoiceChannels.find(vc => vc.channelId === channelId);

    if (!customChannel || customChannel.ownerId !== interaction.user.id) {
      return interaction.reply({ embeds: [new EmbedBuilder().setDescription('You are not the VC owner.').setColor('Red')], ephemeral: true });
    }

    for (const memberId of interaction.values) {
      const member = interaction.guild.members.cache.get(memberId);
      if (!member?.voice?.channel || member.voice.channel.id !== channelId) continue;

      try {
        if (action === 'Mute') await member.voice.setMute(true);
        if (action === 'Unmute') await member.voice.setMute(false);
        if (action === 'Kick') await member.voice.disconnect();
      } catch (err) {
        console.error(`Failed to ${action.toLowerCase()} ${member.user.tag}`, err);
      }
    }

    return interaction.update({
      embeds: [new EmbedBuilder().setDescription(`Selected users have been **${action.toLowerCase()}ed**.`).setColor('Green')],
      components: [],
    });
  });

  client.on('interactionCreate', async interaction => {
    if (interaction.type !== InteractionType.ModalSubmit) return;

    const id = interaction.customId;

    // Rename
    if (id.startsWith('avrename_')) {
      const channelId = id.split('_')[1];
      const userChannel = interaction.member.voice?.channel;

      const dbData = await AutoVoiceSetup.findOne({ customVoiceChannels: { $elemMatch: { channelId } } });
      const customChannel = dbData?.customVoiceChannels.find(vc => vc.channelId === channelId);

      if (!userChannel || !customChannel || userChannel.id !== channelId || customChannel.ownerId !== interaction.user.id) {
        return interaction.reply({ embeds: [new EmbedBuilder().setDescription('You are not authorized.').setColor('Red')], ephemeral: true });
      }

      const newName = interaction.fields.getTextInputValue('newChannelName').slice(0, 32);
      try {
        await userChannel.setName(newName);
        return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`Channel renamed to **${newName}**`).setColor('Green')], ephemeral: true });
      } catch (err) {
        console.error(err);
        return interaction.reply({ embeds: [new EmbedBuilder().setDescription('Failed to rename the channel.').setColor('Red')], ephemeral: true });
      }
    }

    // Bitrate
    if (id.startsWith('avbitform_')) {
      const bitrate = parseInt(interaction.fields.getTextInputValue('bitrateValue'));
      const userChannel = interaction.member.voice?.channel;

      if (!userChannel || isNaN(bitrate) || bitrate < 8000 || bitrate > 96000) {
        return interaction.reply({ embeds: [new EmbedBuilder().setDescription('**Invalid bitrate choose 8000 to 96000**.').setColor('Red')], ephemeral: true });
      }

      try {
        await userChannel.setBitrate(bitrate);
        return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`Bitrate set to **${bitrate}**.`).setColor('Green')], ephemeral: true });
      } catch (err) {
        console.error(err);
        return interaction.reply({ embeds: [new EmbedBuilder().setDescription('Failed to set bitrate.').setColor('Red')], ephemeral: true });
      }
    }

    // User limit
    if (id.startsWith('avuserlimit_')) {
      const limit = parseInt(interaction.fields.getTextInputValue('userLimit'));
      const userChannel = interaction.member.voice?.channel;

      if (!userChannel || isNaN(limit) || limit < 0 || limit > 99) {
        return interaction.reply({ embeds: [new EmbedBuilder().setDescription('**Invalid user limit choose 0 to 99 **.').setColor('Red')], ephemeral: true });
      }

      try {
        await userChannel.setUserLimit(limit);
        return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`**User limit set to __${limit}__ users **.`).setColor('Green')], ephemeral: true });
      } catch (err) {
        console.error(err);
        return interaction.reply({ embeds: [new EmbedBuilder().setDescription('Failed to set user limit.').setColor('Red')], ephemeral: true });
      }
    }
  });
};