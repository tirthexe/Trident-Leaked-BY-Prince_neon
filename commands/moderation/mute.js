const { PermissionsBitField } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "mute",
  description: "Mute a user in the server.",
  aliases:["chup"], 
  async execute(client, message, args) {
    const executor = message.author;
    const reason = args.slice(1).join(" ") || "No reason provided";
    const durationArg = args[1]; // Duration comes after the user mention

    // Check if the user has mute permissions
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You don't have permission to mute members.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if the bot has mute permissions
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | I don't have permission to mute members.`,
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
            `${emoji.error} | Please mention a valid user to mute.`,
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
            `${emoji.error} | Please mention a valid user to mute.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if the user is trying to mute themselves
    if (target.id === executor.id) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You cannot mute yourself.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Check if the target user has admin permissions
    if (target.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | This user is an admin, I can't mute them.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Owner bypass: Owners can mute anyone
    const isOwner = message.guild.ownerId === executor.id;

    // Role hierarchy check (if not owner)
    if (!isOwner && target.roles?.highest.position >= message.member.roles.highest.position) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | You don't have permission to mute this user.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Role hierarchy check for the bot
    if (
      target.roles?.highest &&
      target.roles.highest.position >= message.guild.members.me.roles.highest.position
    ) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | I cannot mute this user because their role is higher than mine.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    // Default mute duration is 7 days if no duration is specified
    let durationMs = 7 * 24 * 60 * 60 * 1000; // Default to 7 days

    // If a duration is provided (e.g., 1m, 1d, 1w)
    if (durationArg) {
      const durationType = durationArg.slice(-1).toLowerCase();
      const durationValue = parseInt(durationArg.slice(0, -1));

      if (isNaN(durationValue) || !["d", "w", "m"].includes(durationType)) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | Invalid duration format. Use \`1d\` (1 day), \`1w\` (1 week), or \`1m\` (1 minute).`,
              executor,
              client,
              null
            ),
          ],
        });
      }

      switch (durationType) {
        case "d":
          durationMs = durationValue * 24 * 60 * 60 * 1000; // Days to milliseconds
          break;
        case "w":
          durationMs = durationValue * 7 * 24 * 60 * 60 * 1000; // Weeks to milliseconds
          break;
        case "m":
          durationMs = durationValue * 60 * 1000; // Minutes to milliseconds
          break;
      }
    }

    // Attempt to mute the user
    try {
      // DM the user before muting
      try {
        await target.send({
          embeds: [
            createEmbed(
              "#FF0000",
              `You have been muted in **${message.guild.name}** for ${
                durationArg || "7d"
              }.\n**Reason:** ${reason}\n**Muted by:** ${executor.tag}`,
              executor,
              client,
              null
            ),
          ],
        });
      } catch (dmError) {
        console.error(`Failed to DM the user: ${dmError.message}`);
      }

      // Mute the user using timeout
      await target.timeout(durationMs, `Muted by ${executor.tag} | ${reason}`);

      // Reply with success
      return message.reply({
        embeds: [
          createEmbed(
            "#00FF00",
            `${emoji.tick} | Successfully muted <@${target.id}> for ${
              durationArg || "7 days"
            }.`,
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
            `${emoji.error} | There was an error trying to mute this user.`,
            executor,
            client,
            null
          ),
        ],
      });
    }
  },
};