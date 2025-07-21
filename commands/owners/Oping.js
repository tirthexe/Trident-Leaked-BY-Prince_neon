const { ownerID, developerIDs } = require("../../owner");
const { EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");

module.exports = {
  name: "0ping",
  description: "Show bot latency, MongoDB ping, and other internal pings.",
  async execute(client, message, args) {
    if (![ownerID, ...developerIDs].includes(message.author.id)) return;

    const sent = await message.channel.send("Pinging...");

    // WebSocket ping
    const websocketPing = client.ws.ping;

    // Message round-trip ping
    const messagePing = sent.createdTimestamp - message.createdTimestamp;

    // MongoDB ping
    let mongoPing = "N/A";
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      mongoPing = `${Date.now() - start}ms`;
    } catch {
      mongoPing = "Failed";
    }

    // REST API ping simulation (via typing indicator)
    let restPing = "N/A";
    try {
      const start = Date.now();
      await message.channel.sendTyping();
      restPing = `${Date.now() - start}ms`;
    } catch {
      restPing = "Failed";
    }

    const embed = new EmbedBuilder()
      .setTitle("Bot Ping Status")
      .setColor("#00FFFF")
      .addFields(
        { name: "WebSocket Ping", value: `${websocketPing}ms`, inline: true },
        { name: "Message Ping", value: `${messagePing}ms`, inline: true },
        { name: "MongoDB Ping", value: mongoPing, inline: true },
        { name: "REST API Ping", value: restPing, inline: true },
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    sent.edit({ content: null, embeds: [embed] });
  },
};