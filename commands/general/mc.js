const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "membercount",
  aliases: ["mc"],
  description: "Shows the correct member count in the server.",
  async execute(client, message) {
    const executor = message.author;

    try {
      // Fetch the total number of members and non-bot members
      const totalMembers = await message.guild.members.fetch(); // Fetches all members
      const humanMembers = totalMembers.filter(member => !member.user.bot).size; // Only human members

      // Create embed
      const embed = createEmbed(
        "#00FF00",
        `
        ${emoji.members} **Total Members:** ${totalMembers.size.toLocaleString()}
        ${emoji.members} **Humans:** ${humanMembers.toLocaleString()}
        `,
        executor,
        client,
        null
      );

      // Send the embed
      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);

      // Handle errors
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} There was an error fetching the member count.`,
            executor,
            client,
            null
          ),
        ],
      });
    }
  },
};