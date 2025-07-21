const { SlashCommandBuilder } = require("discord.js");
const Bio = require("../../database/bio"); // Import the Bio model

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setbio") // Command name
    .setDescription("Set your custom bio.") // Command description
    .addStringOption((option) =>
      option
        .setName("bio")
        .setDescription("Your custom bio")
        .setRequired(true) // Ensure the bio is provided
    ),
  async execute(interaction, client) {
    const bio = interaction.options.getString("bio"); // Get bio from slash command input

    try {
      let userBio = await Bio.findOne({ userId: interaction.user.id });

      if (!userBio) {
        userBio = new Bio({ userId: interaction.user.id, bio });
      } else {
        userBio.bio = bio; // Update bio
      }

      await userBio.save();

      await interaction.reply(`Your bio has been updated to: **${bio}**`);
    } catch (error) {
      console.error("Error in setbio command:", error);
      await interaction.reply({
        content: "There was an error while setting your bio.",
        ephemeral: true, // Makes the error message visible only to the user
      });
    }
  },
};