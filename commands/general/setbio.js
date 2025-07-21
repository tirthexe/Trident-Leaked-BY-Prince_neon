const Bio = require("../../database/bio"); // Import the Bio model

module.exports = {
  name: "setbio",
  description: "Set your custom bio.",
  async execute(client, message, args) {
    const bio = args.join(" ");
    
    if (!bio) {
      return message.channel.send("Please provide a bio.");
    }

    try {
      let userBio = await Bio.findOne({ userId: message.author.id });

      if (!userBio) {
        userBio = new Bio({ userId: message.author.id, bio });
      } else {
        userBio.bio = bio; // Update bio
      }

      await userBio.save();

      return message.channel.send(`Your bio has been updated to: **${bio}**`);
    } catch (error) {
      console.error(error);
      return message.channel.send("There was an error while setting your bio.");
    }
  },
};