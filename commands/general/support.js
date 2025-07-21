const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "support",
  description: "Get the link to the support server.",
  execute(client, message) {
    // Create an embed
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("Need Help?")
      .setDescription("Click the button below to join the support server!")
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    // Create the button
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Join Support Server")
        .setURL("https://discord.gg/lovers-arenaa") // Replace with your actual support server link
        .setStyle(ButtonStyle.Link) // Link style button
    );

    // Send the embed with the button
    message.channel.send({ embeds: [embed], components: [row] });
  },
};