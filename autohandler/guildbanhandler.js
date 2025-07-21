const { EmbedBuilder } = require('discord.js');
const GuildBan = require('../database/guildban');

module.exports = function (client) {
  client.on('guildCreate', async (guild) => {
    try {
      // Check if the guild is in the banned list
      const bannedGuild = await GuildBan.findOne({ guildId: guild.id });

      if (bannedGuild) {
        // Create an embed message to notify the owner of the guild
        const owner = await guild.fetchOwner();
        const embed = new EmbedBuilder()
          .setColor('#FF0000') // Red for banned guild
          .setTitle('Guild Blacklisted')
          .setDescription(`
            **Hey ${owner.user}, this guild is blacklisted!** 🚫

            ・ Unfortunately, this guild has been blacklisted due to prior issues or violations.
            ・ If you think this is a mistake, please contact us via our [Support Server](https://discord.gg/lovers-arenaa).
          `)
          .setThumbnail(guild.iconURL()) // Guild icon as thumbnail
          .setFooter({
            text: 'Your Friendly Music Bot',
            iconURL: client.user.displayAvatarURL(),
          })
          .setTimestamp();

        // Send the embed to the guild owner, handling error if DMs are disabled
        try {
          await owner.user.send({ embeds: [embed] });
        } catch (error) {
          console.error('Could not send DM to owner:', error);
        }

        // Log and leave the banned guild
        console.log(`Joined a banned guild: ${guild.name} (${guild.id}). Leaving immediately...`);
        await guild.leave();
      }
    } catch (error) {
      // Log any other errors related to the guildCreate event
      console.error('Error handling banned guild:', error);
    }
  });
};