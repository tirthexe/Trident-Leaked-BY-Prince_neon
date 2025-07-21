const { EmbedBuilder } = require('discord.js');

module.exports = function(client) {
  client.on('guildCreate', async (guild) => {
    try {
      // Get the guild owner's user object
      const owner = await guild.fetchOwner();

      // Create the embed message
      const embed = new EmbedBuilder()
        .setColor('#ff0000') // You can change the color
        .setTitle('Thanks for Adding Me!')
        .setDescription(`
          **Hey ${owner.user}, thanks for adding me!** 🎉

          ・ My default prefix is **\`-\`**
          ・ You can use the **\`-help\`** command to get the list of commands.
          ・ Our [documentation](https://discord.gg/lovers-arenaa) offers detailed information & guides for commands.
          ・ Feel free to join our [Support Server](https://discord.gg/lovers-arenaa) if you need help/support for anything related to the bot! 😊
        `)
        .setThumbnail(guild.iconURL()) // Guild icon as thumbnail
        .setFooter({
          text: 'Your Friendly TRIDENT BOT', // Footer text
          iconURL: client.user.displayAvatarURL(), // Bot's logo as footer icon
        })
        .setTimestamp();

      // Send the embed to the guild owner's DM, handling error if DMs are disabled
      try {
        await owner.user.send({ embeds: [embed] });
      } catch (error) {
        console.error('Could not send DM to owner:', error); // Log error but don't crash the bot
      }

      // Also send the message to the user who invited the bot (guild's invite owner)
      const invites = await guild.invites.fetch();
      const invite = invites.find(invite => invite.inviter);
      
      if (invite) {
        try {
          await invite.inviter.send({ embeds: [embed] });
        } catch (error) {
          console.error('Could not send DM to inviter:', error); // Log error for inviter if DMs are disabled
        }
      }

    } catch (error) {
      // Log any other errors related to the guildCreate event
      console.error('Error sending welcome message:', error);
    }
  });
};