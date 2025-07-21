const Autorole = require('../database/Autorole');

module.exports = (client) => {
  client.on('guildMemberAdd', async (member) => {
    try {
      const data = await Autorole.findOne({ guildId: member.guild.id });
      if (!data || !data.roles.length) return;

      const validRoles = data.roles.filter(roleId => {
        const role = member.guild.roles.cache.get(roleId);
        return role && member.guild.members.me.roles.highest.position > role.position;
      });

      if (!validRoles.length) return;

      for (const roleId of validRoles) {
        await member.roles.add(roleId, 'AutoRole');
      }

    } catch (error) {
      console.error(`[AutoRole Handler Error]:`, error);
    }
  });
};