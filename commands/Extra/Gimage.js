const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const Gimage = require("../../database/Gimage");

module.exports = {
  name: "gimage",
  aliases: ["giveawayinage"],
  description: "Set, view or remove giveaway image for this server",
  async execute(client, message, args) {
    if (!message.guild || !message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        content: "You need the `Administrator` permission to use this command.",
      });
    }

    const input = args[0];

    if (!input) {
      // Show current image
      const existing = await Gimage.findOne({ guildId: message.guild.id });
      if (!existing) {
        return message.reply({
          content: "No giveaway image is set for this server.",
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("Current Giveaway Image")
        .setImage(existing.image)
        .setColor("#ff9900")
        .setFooter({ text: "Use `gimage none` to remove or `gimage <link>` to replace." });

      return message.reply({ embeds: [embed] });
    }

    if (input.toLowerCase() === "none") {
      const existing = await Gimage.findOne({ guildId: message.guild.id });
      if (!existing) {
        return message.reply({ content: "No image is set for this server." });
      }

      await Gimage.deleteOne({ guildId: message.guild.id });
      return message.reply({ content: "Giveaway image has been removed." });
    }

    // Else, assume it's a link
    if (!input.startsWith("http")) {
      return message.reply({ content: "Please provide a valid image link or use `none` to remove." });
    }

    try {
      const existing = await Gimage.findOne({ guildId: message.guild.id });

      if (existing) {
        existing.image = input;
        await existing.save();
      } else {
        await Gimage.create({
          guildId: message.guild.id,
          image: input,
        });
      }

      return message.reply({ content: "Giveaway image has been set successfully." });
    } catch (err) {
      console.error("Failed to set giveaway image:", err);
      return message.reply({ content: "Something went wrong while saving the image." });
    }
  },
};