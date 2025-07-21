const Autorole = require('../database/Autorole');

module.exports = (client) => {
  client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
      const member = newState.member;
      if (!member || member.user.bot) return;

      const data = await Autorole.findOne({ guildId: member.guild.id });
      if (!data || !data.vcrole) return;

      const role = member.guild.roles.cache.get(data.vcrole);
      if (!role) return;

      const botMember = member.guild.members.me;
      if (role.position >= botMember.roles.highest.position) return;

      const joinedVC = !oldState.channel && newState.channel;
      const leftVC = oldState.channel && !newState.channel;

      if (joinedVC) {
        if (!member.roles.cache.has(role.id)) {
          await member.roles.add(role, 'Joined VC - VC Role');
        }
      } else if (leftVC) {
        if (member.roles.cache.has(role.id)) {
          await member.roles.remove(role, 'Left VC - VC Role');
        }
      }

    } catch (error) {
      console.error('[VC Role Handler Error]:', error);
    }
  });
};