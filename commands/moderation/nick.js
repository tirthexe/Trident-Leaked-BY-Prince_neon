const { PermissionsBitField } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "nick",
  description: "Change or reset a user's nickname.",
  async execute(client, message, args) {
    const executor = message.author;

    // Check if the user has permission to manage nicknames
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You don't have permission to change nicknames.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Ensure arguments are provided
    if (!args[0]) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | Please mention a valid user to change their nickname.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    const target =
      message.mentions.members.first() ||
      (await message.guild.members.fetch(args[0]).catch(() => null));

    if (!target) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | Please mention a valid user to change their nickname.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // If the executor is changing their own nickname, skip the role hierarchy check
    if (target.id === executor.id) {
      // Check if the bot has permission to manage nicknames
      if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | I don't have permission to manage nicknames.`,
              executor,
              client,
              null
            ),
          ],
        });
      }

      // Check if the bot's role is higher than the target's role
      if (target.roles?.highest.position >= message.guild.members.me.roles.highest.position) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | I can't manage your nickname because your role is higher than mine.`,
              executor,
              client,
              null
            ),
          ],
        });
      }
    } else {
      // Role hierarchy check for changing someone else's nickname
      if (target.roles?.highest.position >= message.member.roles.highest.position) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | You can't manage this user's nickname due to role hierarchy.`,
              executor,
              client,
              null
            ),
          ],
        });
      }

      // Check if the bot has permission to manage nicknames
      if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | I don't have permission to manage nicknames.`,
              executor,
              client,
              null
            ),
          ],
        });
      }

      // Check if the bot's role is higher than the target's role
      if (target.roles?.highest.position >= message.guild.members.me.roles.highest.position) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | I can't manage this user's nickname because their role is higher than mine.`,
              executor,
              client,
              null
            ),
          ],
        });
      }
    }

    // If the command is used as "-Nick @user", reset the nickname
    if (args.length === 1) {
      try {
        await target.setNickname(null, `Nickname reset by ${executor.tag}`);
        return message.reply({
          embeds: [
            createEmbed(
              "#00FF00",
              `${emoji.tick} | Successfully reset the nickname of <@${target.id}>.`,
              executor,
              client,
              null
            ),
          ],
        });
      } catch (error) {
        console.error(error);
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | There was an error trying to reset the nickname.`,
              executor,
              client,
              null
            ),
          ],
        });
      }
    }

    // If a nickname is provided, change it
    const nickname = args.slice(1).join(" ");
    if (nickname) {
      try {
        await target.setNickname(nickname, `Nickname changed by ${executor.tag}`);
        return message.reply({
          embeds: [
            createEmbed(
              "#00FF00",
              `${emoji.tick} | Successfully changed the nickname of <@${target.id}> to **${nickname}**.`,
              executor,
              client,
              null
            ),
          ],
        });
      } catch (error) {
        console.error(error);
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | There was an error trying to change the nickname.`,
              executor,
              client,
              null
            ),
          ],
        });
      }
    }
  },
};