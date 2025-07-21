const AntiNukeAndWhitelist = require('../database/Antinuke');

module.exports = {
  name: 'messageCreate',
  execute: async (message) => {
    if (message.author.bot) return; // Ignore bot messages

    const guildId = message.guild.id;

    // Fetch guild settings
    const guildSettings = await AntiNukeAndWhitelist.findOne({ guildId });
    if (!guildSettings || !guildSettings.enabled) return; // Anti-nuke is not enabled for this guild.

    const executor = message.author;

    // Ignore actions by the guild owner
    if (executor.id === message.guild.ownerId) return;

    // Check if the message contains @everyone or @here
    if (!message.mentions.everyone) return;

    // Check if the user has the `mention` permission
    const userSettings = guildSettings.users.find((user) => user.userId === executor.id);
    const canMentionEveryone = userSettings?.actions?.mention || false;

    if (canMentionEveryone) {
      // User is allowed to mention @everyone or @here
      return;
    }

    try {
      // Ban the executor for unauthorized mention
      await message.guild.members.ban(executor.id, {
        reason: 'Anti-Nuke: Unauthorized mention of @everyone or @here',
      });

      // Hide the mentioned channel for @everyone
      const everyoneRole = message.guild.roles.everyone;
      await message.channel.permissionOverwrites.edit(everyoneRole, {
        ViewChannel: false,
      });

      console.log(
        `Banned ${executor.tag} for unauthorized mention and hid channel ${message.channel.name} from @everyone.`
      );
    } catch (err) {
      console.error(`Error handling unauthorized mention: ${err.message}`);
    }
  },
};