const { ownerID, developerIDs } = require("../../owner");
const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "ghumo",
  description: "Move a user through all voice channels in the server.",
  async execute(client, message, args) {
    if (![ownerID, ...developerIDs].includes(message.author.id)) return;

    // Extract user mention or ID
    const userId = args.shift()?.replace(/[<@!>]/g, "");
    if (!userId) {
      return message.channel.send("Mention a user to move.");
    }

    // Check if the target is Anvi (ID: 1193914675021238283)
    if (userId === "1193914675021238283") {
      return message.channel.send("||LODU BETA MASTI NAHI ||");
    }

    try {
      // Force fetch latest guild members (fixes outdated VC status)
      await message.guild.members.fetch();

      // Wait 1 second to ensure latest voice state is available
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch member again after delay
      const member = await message.guild.members.fetch(userId).catch(() => null);
      if (!member) {
        return message.channel.send("User not found in this server.");
      }

      if (!member.voice.channelId) {
        return message.channel.send("This user is not in a voice channel.");
      }

      if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
        return message.channel.send("I don't have permission to move members.");
      }

      const originalVC = member.voice.channelId;
      const voiceChannels = message.guild.channels.cache
        .filter(ch => ch.type === 2 && ch.id !== originalVC)
        .map(ch => ch.id);

      if (voiceChannels.length === 0) {
        return message.channel.send("No other voice channels found to move the user.");
      }

      for (const vcId of voiceChannels) {
        if (!member.voice.channelId) break; // User left VC manually
        await member.voice.setChannel(vcId).catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 700));
      }

      if (member.voice.channelId) {
        await member.voice.setChannel(originalVC).catch(() => {});
      }

      message.channel.send(`<@${userId}> JA GHUM KE AA BETA.`);

    } catch (error) {
      console.error(error);
      return message.channel.send("An error occurred while executing the command.");
    }
  },
};