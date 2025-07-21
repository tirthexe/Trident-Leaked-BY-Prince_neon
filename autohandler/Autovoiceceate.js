const AutoVoiceSetup = require('../database/AutoVoiceSetup');

module.exports = (client) => {
  client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
      const member = newState.member;
      if (!member || member.user.bot) return;

      const guild = newState.guild;
      if (!guild) return;

      const setup = await AutoVoiceSetup.findOne({ guildId: guild.id });
      if (!setup || !setup.enabled || !setup.voiceChannelId) return;

      const joinedChannelId = newState.channelId;
      const leftChannelId = oldState.channelId;
      const triggerChannelId = setup.voiceChannelId;

      // When user joins the trigger channel
      if (joinedChannelId === triggerChannelId && leftChannelId !== joinedChannelId) {
        const category = guild.channels.cache.get(setup.categoryId);
        if (!category || category.type !== 4) return;

        // Create personal VC
        const newVc = await guild.channels.create({
          name: `${member.user.username}-vc`,
          type: 2,
          parent: category.id,
          permissionOverwrites: [
            {
              id: guild.id,
              allow: ['Connect', 'Speak', 'ViewChannel'],
            },
            {
              id: member.id,
              allow: ['Connect', 'Speak', 'ViewChannel'],
            },
          ],
          reason: 'AutoVoice: Temporary VC created',
        });

        // Move user to their VC
        await member.voice.setChannel(newVc).catch(() => {});

        // Add to database
        setup.customVoiceChannels ??= [];
        setup.customVoiceChannels.push({
          channelId: newVc.id,
          ownerId: member.id,
        });

        await setup.save();
      }

      // When user leaves a voice channel
      if (leftChannelId) {
        const leftChannel = guild.channels.cache.get(leftChannelId);
        if (!leftChannel) return;

        const isCustomVc = setup.customVoiceChannels?.find(vc => vc.channelId === leftChannelId);
        if (!isCustomVc) return;

        if (leftChannel.members.size === 0) {
          await leftChannel.delete('AutoVoice: Empty custom VC deleted');
          setup.customVoiceChannels = setup.customVoiceChannels.filter(vc => vc.channelId !== leftChannelId);
          await setup.save();
        }
      }
    } catch (err) {
      console.error('AutoVoice error:', err);
    }
  });
};