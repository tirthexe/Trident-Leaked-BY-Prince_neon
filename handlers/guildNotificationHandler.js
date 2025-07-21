const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const AntiNukeAndWhitelist = require('../database/Antinuke');

module.exports = (client) => {
  client.on('guildCreate', async (guild) => {
    const supportChannel = await client.channels.fetch("1329091683610001489");
    if (!supportChannel) return;

    let inviter = null;
    let inviteLink = "Unable to generate invite link";

    try {
      const invites = await guild.invites.fetch();
      inviter = invites.find(inv => inv.inviter)?.inviter;
    } catch {}

    const owner = await guild.fetchOwner().catch(() => null);

    const textChannel = guild.channels.cache.find(
      ch =>
        ch.type === 0 &&
        ch.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.CreateInstantInvite)
    );

    if (textChannel) {
      try {
        const invite = await textChannel.createInvite({ maxAge: 0, maxUses: 0 });
        inviteLink = invite.url;
      } catch {}
    }

    const createdTimestamp = `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`; // e.g. "2 days ago"

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setAuthor({
        name: inviter ? inviter.username : "Unknown",
        iconURL: inviter?.displayAvatarURL() || client.user.displayAvatarURL()
      })
      .setDescription(
        `**Guild Name:** ${guild.name}\n` +
        `**Total Users:** ${guild.memberCount}\n` +
        `**Server Owner:** ${owner ? `${owner.user.tag} [${owner.id}]` : "Unknown"}\n` +
        `**Guild Created:** ${createdTimestamp}\n` +
        `**Bot's Total Servers:** ${client.guilds.cache.size}\n` +
        `**Invite Link:** ${inviteLink}`
      )
      .setTimestamp();

    supportChannel.send({ embeds: [embed] });
  });

  client.on('guildDelete', async (guild) => {
    const supportChannel = await client.channels.fetch("1329091756092035122");
    if (!supportChannel) return;

    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId: guild.id });

    let description = `**Bot removed from guild:**\n` +
                      `**Name:** ${guild.name}\n` +
                      `**ID:** ${guild.id}`;

    if (guildSettings?.enabled) {
      await AntiNukeAndWhitelist.deleteOne({ guildId: guild.id });
      description += `\n**AntiNuke setting removed from database.**`;
    }

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setDescription(description)
      .setTimestamp();

    supportChannel.send({ embeds: [embed] });
  });
};