const { EmbedBuilder } = require("discord.js");
const AntiNukeAndWhitelist = require("../../database/Antinuke");
const emoji = require("../../emoji.js");

module.exports = {
  name: "whitelisted",
  description: "Show the list of all whitelisted users.",
  aliases: ["wlist"],
  async execute(client, message) {
    const executor = message.author;

    let guildSettings = await AntiNukeAndWhitelist.findOne({ guildId: message.guild.id });
    if (!guildSettings) {
      return message.channel.send(`${emoji.cross} | AntiNuke settings not found for this server.`);
    }

    if (!guildSettings.enabled) {
      return message.channel.send(`${emoji.error} | Please enable AntiNuke first. Current status: **AntiNuke is disabled**.`);
    }

    if (!guildSettings.users.length) {
      return message.channel.send(`${emoji.cross} | No users are whitelisted in this server.`);
    }

    const whitelistedUsers = guildSettings.users
      .map((u) => `> <@${u.userId}> | [${u.userId}]`)
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("Whitelisted Users")
      .setDescription(whitelistedUsers)
      .setThumbnail(client.user.displayAvatarURL()) // **Bot ka avatar as main icon (thumbnail)**
      .setFooter({ text: "TRIDENT ❤ DEVELOPMENT.", iconURL: client.user.displayAvatarURL() }) // **Bot ka avatar in footer**
      .setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() }); // **User ka avatar & name in author**

    message.channel.send({ embeds: [embed] });
  },
};