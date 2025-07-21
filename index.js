const { Client, GatewayIntentBits } = require("discord.js");
const loadHandlers = require("./handlers/handler_loader"); // Centralized handler loader

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildVoiceStates, 
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildInvites,  //
  ], 
  });
// Bot login
(async () => {
  try {
    await client.login("MTM2NDMzMTM3NTIxMzE1NDQwNg.GZzrN4.hMAFpWb2RozavtpPUz387_Diy2HOuVXt3yJSlY"); // Replace with your bot token
    console.log("Bot logged in successfully!");
  } catch (error) {
    console.error("Bot login failed:", error);
  }
})();

// Cache invites on ready
client.on("ready", async () => {
  console.log(`Bot is online as ${client.user.tag}`);

  client.invites = new Map();

  for (const [guildId, guild] of client.guilds.cache) {
    try {
      const invites = await guild.invites.fetch();
      client.invites.set(guildId, invites);
      console.log(`[INVITE CACHE] Cached invites for ${guild.name}`);
    } catch (err) {
      console.log(`[INVITE CACHE ERROR] ${guild.name}: ${err.message}`);
    }
  }

  loadHandlers(client); // Load all handlers
});

// Error handling
client.on("error", (err) => {
  console.error("Bot encountered an error:", err);
});