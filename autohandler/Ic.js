const InviteCount = require('../database/invitecount');
const { Collection } = require('discord.js');

const inviteCache = new Map(); // guildId => Collection<inviteCode, invite>

module.exports = (client) => {
  async function fetchGuildInvites(guild) {
    try {
      const invites = await guild.invites.fetch();
      inviteCache.set(guild.id, invites);
      console.log(`[InviteCount] Cached invites for guild ${guild.id}`);
    } catch (err) {
      console.error(`[InviteCount] Failed to fetch invites for guild ${guild.id}:`, err);
    }
  }

  client.on('ready', async () => {
    try {
      for (const guild of client.guilds.cache.values()) {
        await fetchGuildInvites(guild);
      }
      console.log('[InviteCount] Initial invite cache loaded.');
    } catch (error) {
      console.error('[InviteCount Ready Handler Error]:', error);
    }
  });

  client.on('inviteCreate', (invite) => {
    try {
      let invites = inviteCache.get(invite.guild.id);
      if (!invites) invites = new Collection();
      invites.set(invite.code, invite);
      inviteCache.set(invite.guild.id, invites);
      console.log(`[InviteCount] Invite created ${invite.code} cached for guild ${invite.guild.id}`);
    } catch (error) {
      console.error('[InviteCreate Handler Error]:', error);
    }
  });

  client.on('inviteDelete', (invite) => {
    try {
      let invites = inviteCache.get(invite.guild.id);
      if (!invites) return;
      invites.delete(invite.code);
      inviteCache.set(invite.guild.id, invites);
      console.log(`[InviteCount] Invite deleted ${invite.code} removed from cache for guild ${invite.guild.id}`);
    } catch (error) {
      console.error('[InviteDelete Handler Error]:', error);
    }
  });

  client.on('guildMemberAdd', async (member) => {
    try {
      const guild = member.guild;

      if (!inviteCache.has(guild.id)) {
        await fetchGuildInvites(guild);
      }

      const oldInvites = inviteCache.get(guild.id);
      const newInvites = await guild.invites.fetch();

      let usedInvite = null;

      for (const [code, newInvite] of newInvites) {
        const oldInvite = oldInvites.get(code);
        if (!oldInvite && newInvite.uses > 0) {
          usedInvite = newInvite;
          break;
        } else if (oldInvite && newInvite.uses > oldInvite.uses) {
          usedInvite = newInvite;
          break;
        }
      }

      inviteCache.set(guild.id, newInvites);

      if (!usedInvite) {
        console.log(`[InviteCount] No used invite found for member ${member.id} join in guild ${guild.id}`);
        return;
      }

      const inviterId = usedInvite.inviter?.id;
      if (!inviterId) {
        console.log(`[InviteCount] Used invite has no inviter for member ${member.id} join in guild ${guild.id}`);
        return;
      }

      const guildData = await InviteCount.findOne({ guildId: guild.id });
      if (!guildData || !guildData.enable) {
        console.log(`[InviteCount] Guild ${guild.id} not enabled or data not found`);
        return;
      }

      let inviterStats = guildData.users.find(u => u.userId === inviterId);

      if (!inviterStats) {
        inviterStats = {
          userId: inviterId,
          allTimeJoin: 0,
          monthJoin: 0,
          todayJoin: 0,
          yesterdayJoin: 0,
          allTimeLeft: 0,
          monthLeft: 0,
          todayLeft: 0,
          yesterdayLeft: 0,
          allTimeRejoin: 0,
          monthRejoin: 0,
          todayRejoin: 0,
          yesterdayRejoin: 0,
          allTimeFake: 0,
          monthFake: 0,
          todayFake: 0,
          yesterdayFake: 0,
          joined: [],
          lefted: []
        };
        guildData.users.push(inviterStats);
        console.log(`[InviteCount] Created new inviter stats for user ${inviterId} in guild ${guild.id}`);
      }

      if (!inviterStats.joined.includes(member.id)) {
        inviterStats.joined.push(member.id);
      }

      inviterStats.allTimeJoin++;

      // Tell Mongoose that the subdocument was modified
      guildData.markModified('users');

      await guildData.save();

      console.log(`[InviteCount] Incremented allTimeJoin for inviter ${inviterId} due to member ${member.id} join in guild ${guild.id}`);
    } catch (error) {
      console.error('[InviteCount guildMemberAdd Handler Error]:', error);
    }
  });
};