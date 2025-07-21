const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");
const AntiNuke = require("../../database/Antinuke");
const { ownerID } = require("../../owner"); // Contains bot owner ID

module.exports = {
  name: "extraowner",
  description: "Manage extra owners for the server.",
  async execute(client, message, args) {
    const subcommand = args[0]?.toLowerCase();
    const executor = message.author;

    // Check if executor is guild owner or bot owner
    const isGuildOwner = message.guild.ownerId === executor.id;
    const isBotOwner = executor.id === ownerID;

    if (!isGuildOwner && !isBotOwner) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} Only the guild owner or bot owner can use this command.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    const guildId = message.guild.id;
    const guildSettings =
      (await AntiNuke.findOne({ guildId })) || new AntiNuke({ guildId });

    switch (subcommand) {
      case "set": {
        const target =
          message.mentions.members.first() ||
          (await message.guild.members.fetch(args[1]).catch(() => null));

        if (!target) {
          return message.reply({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} Please mention a valid user or provide a valid user ID to set as extra owner.`,
                executor,
                client,
                null
              ),
            ],
          });
        }

        if (guildSettings.extraOwners.includes(target.id)) {
          return message.reply({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} This user is already an extra owner.`,
                executor,
                client,
                null
              ),
            ],
          });
        }

        if (isGuildOwner && guildSettings.extraOwners.length >= 2) {
          return message.reply({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} Guild owners can only set up to 2 extra owners.`,
                executor,
                client,
                null
              ),
            ],
          });
        }

        guildSettings.extraOwners.push(target.id);
        await guildSettings.save();

        return message.reply({
          embeds: [
            createEmbed(
              "#00FF00",
              `${emoji.tick} Successfully set <@${target.id}> as an extra owner.`,
              executor,
              client,
              null
            ),
          ],
        });
      }

      case "list": {
        const extraOwners = guildSettings.extraOwners || [];
        if (extraOwners.length === 0) {
          return message.reply({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} No extra owners are set for this server.`,
                executor,
                client,
                null
              ),
            ],
          });
        }

        const ownerList = extraOwners.map((id) => `<@${id}>`).join("\n");
        return message.reply({
          embeds: [
            createEmbed(
              "#00FF00",
              `${emoji.tick} Extra owners for this server:\n${ownerList}`,
              executor,
              client,
              null
            ),
          ],
        });
      }

      case "remove": {
        const target =
          message.mentions.members.first() ||
          (await message.guild.members.fetch(args[1]).catch(() => null));

        if (!target || !guildSettings.extraOwners.includes(target.id)) {
          return message.reply({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} This user is not an extra owner.`,
                executor,
                client,
                null
              ),
            ],
          });
        }

        guildSettings.extraOwners = guildSettings.extraOwners.filter(
          (id) => id !== target.id
        );
        await guildSettings.save();

        return message.reply({
          embeds: [
            createEmbed(
              "#00FF00",
              `${emoji.tick} Successfully removed <@${target.id}> as an extra owner.`,
              executor,
              client,
              null
            ),
          ],
        });
      }

      case "reset": {
        guildSettings.extraOwners = [];
        await guildSettings.save();

        return message.reply({
          embeds: [
            createEmbed(
              "#00FF00",
              `${emoji.tick} Successfully reset all extra owners.`,
              executor,
              client,
              null
            ),
          ],
        });
      }

      default:
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} Invalid subcommand. Use \`set\`, \`list\`, \`remove\`, or \`reset\`.`,
              executor,
              client,
              null
            ),
          ],
        });
    }
  },
};