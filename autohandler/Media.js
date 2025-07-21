const { createEmbed } = require('../embed');
const emoji = require('../emoji');
const Media = require('../database/Media');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (!message || message.author.bot || !message.guild || !message.channel) return;

    const executor = message.author;
    const member = message.member;

    // Fetch media config
    const config = await Media.findOne({ guildId: message.guild.id });
    if (!config || !config.channelId) return;

    const isMediaChannel = message.channel.id === config.channelId;
    if (!isMediaChannel) return;

    // Check if user is admin or has bypass role
    const isAdmin = member.permissions.has("Administrator");
    const hasBypass = config.bypassRoles?.some(roleId => member.roles.cache.has(roleId));

    if (isAdmin || hasBypass) return;

    // Allow messages that include attachments (media), or embeds from links
    const hasMedia =
      message.attachments.size > 0 ||
      (message.embeds.length > 0 && message.embeds.some(embed => embed.image || embed.video));

    if (hasMedia) return;

    // Delete the invalid message
    await message.delete().catch(() => null);

    // Send warning message
    const warning = await message.channel.send({
      embeds: [
        createEmbed(
          '#FF9900',
          `${emoji.error} | This channel is media-only. Please do not send text, emojis, or stickers here.`,
          executor,
          client,
          null
        ),
      ],
    });

    // Auto-delete the warning after 5 seconds
    setTimeout(() => {
      warning.delete().catch(() => null);
    }, 5000);
  });
};