const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const emojis = require('../../emoji.js'); // Import emojis from emoji.js

module.exports = {
  name: 'userinfo',
  aliases: ['ui'],
  description: 'Get information about a user.',
  execute: async (client, message, args) => {
    let target;

    // Check if there is an argument (mention or ID)
    if (args[0]) {
      // If the argument is a mention
      if (message.mentions.members.size) {
        target = message.mentions.members.first(); // Mentioned user in the server
      } else {
        // If the argument is a valid user ID
        const userId = args[0];
        target = message.guild.members.cache.get(userId); // Check if the user is in the server

        // If not in the server, fetch the user globally
        if (!target) {
          try {
            target = await client.users.fetch(userId); // Fetch user globally
          } catch (err) {
            return message.channel.send("🚫 Invalid user ID or mention. Please try again.");
          }
        }
      }
    }

    // If no valid argument, show the command user's information
    if (!target) {
      target = message.member;
    }

    const user = target.user || target; // Handle both GuildMember and User objects
    const member = message.guild.members.cache.get(user.id); // Get the guild member if they are in the server

    // Basic information
    const userName = user.username;
    const userId = user.id;
    const isBot = user.bot ? emojis.check : emojis.cross;
    const nickName = member?.nickname || "None";

    // Discord badges with emojis
    const userFlags = await user.fetchFlags();
    const discordBadges = userFlags.toArray().length > 0
      ? userFlags.toArray().map(flag => emojis[flag.toLowerCase()] || flag).join(", ")
      : `${emojis.cross} No User Badges`;

    // Account creation and server join time
    const accountCreated = `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`;
    const serverJoined = member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Not in this server";

    // Roles (limit to top 5 and summarize the rest)
    const roles = member
      ? member.roles.cache
          .filter(role => role.id !== message.guild.id)
          .sort((a, b) => b.position - a.position)
          .map(role => `<@&${role.id}>`)
      : [];
    const roleCount = roles.length;
    const displayedRoles = roles.slice(0, 5); // Show only top 5 roles
    const extraRoles = roleCount > 5 ? ` +${roleCount - 5} more` : "";
    const rolesDisplay = displayedRoles.join(', ') + (extraRoles ? extraRoles : "");

    const highestRole = member ? member.roles.highest : null;
    const roleColor = highestRole?.hexColor || "#101111";

    // Permissions
    const keyPermissions = member
      ? member.permissions.toArray()
          .map(perm => `${emojis[perm.toLowerCase().replace(/_/g, '')] || ''}${perm.toLowerCase().replace(/_/g, '')}`)
          .join(', ')
      : "None";

    // Acknowledgement based on permissions
    let acknowledgement = `${emojis.members} Member`;
    if (member) {
      if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        acknowledgement = `${emojis.admin} Admin`;
      } else if (member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        acknowledgement = `${emojis.mod} Moderator`;
      }
    }

    // Fetch user banner if available
    let userBannerURL = null;
    try {
      const userFetch = await client.users.fetch(user.id, { force: true });
      userBannerURL = userFetch.bannerURL({ size: 2048, dynamic: true });
    } catch (err) {
      userBannerURL = null; // No banner found
    }

    // Embed structure
    const embed = new EmbedBuilder()
      .setColor(roleColor)
      .setAuthor({ name: `${userName}'s Info`, iconURL: user.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 2048 }))
      .addFields(
        { name: "User Mention", value: `<@${userId}>`, inline: true },
        { name: "User ID", value: `${userId}`, inline: true },
        { name: "Bot?", value: `${isBot}`, inline: true },
        { name: "**Username**", value: userName, inline: true },
        { name: "**Nickname**", value: nickName, inline: true },
        { name: "**Discord Badges**", value: discordBadges, inline: true },
        { name: "**Account Created**", value: accountCreated, inline: true },
        { name: "**Server Joined**", value: serverJoined, inline: true },
        { name: "**Highest Role**", value: highestRole ? `<@&${highestRole.id}>` : "None", inline: true },
        { name: "**Color**", value: `${roleColor}`, inline: true },
        { name: `**Roles [${roleCount}]**`, value: rolesDisplay || "None", inline: false },
        { name: "__Key Permissions__", value: keyPermissions || "None", inline: false },
        { name: "__Acknowledgement__", value: acknowledgement, inline: false }
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    if (userBannerURL) {
      embed.setImage(userBannerURL); // Add banner if it exists
    }

    // Send the embed
    message.channel.send({ embeds: [embed] });
  },
};