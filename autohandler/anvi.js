const emoji = require("../emoji.js");

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    if (!message || !message.client || !message.guild) return; // Ensure valid message object
    if (message.author.bot) return; // Ignore bot messages

    // Check if message contains "<@1193914675021238283>" or "anvi"
    if (!message.content.includes("<@1193914675021238283>") && !message.content.toLowerCase().includes("anvi")) return;

    // Check if bot has permission to add reactions
    if (!message.channel.permissionsFor(message.guild.members.me)?.has("AddReactions")) return;

    // React with only heart emoji
    try {
      await message.react(emoji.heart);
    } catch (error) {
      console.error(`[ERROR] Failed to react in #${message.channel.name} (${message.guild.name}):`, error);
    }
  });
}