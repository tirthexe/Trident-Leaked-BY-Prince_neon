const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("support")
    .setDescription("Get the link to the support server."),
  async execute(interaction, client) {
    // Create an embed
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("Need Help?")
      .setDescription("Click the button below to join the support server!")
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    // Create the button
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Join Support Server")
        .setURL("https://discord.gg/lovers-arenaa") // Replace with your actual support server link
        .setStyle(ButtonStyle.Link) // Link style button
    );

    // Send the embed with the button
    await interaction.reply({ embeds: [embed], components: [row] });
  },
};