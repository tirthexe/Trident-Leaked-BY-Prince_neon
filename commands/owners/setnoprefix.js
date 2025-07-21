const fs = require("fs");
const { ownerID, developerIDs } = require("../../owner"); // Import owner and developer IDs
const { cross, tick, next } = require("../../emoji"); // Import emojis
const { createEmbed } = require("../../embed"); // Import embed builder

module.exports = {
  name: "np",
  description: "Manage no-prefix users (add/remove/list).",
  execute(client, message, args, noPrefixUsers, noPrefixFilePath) {
    // Check if the user is an owner or developer
    if (![ownerID, ...developerIDs].includes(message.author.id)) {
      return; // Ignore silently for unauthorized users
    }

    const subCommand = args.shift()?.toLowerCase(); // Extract the subcommand
    if (!subCommand) {
      return message.channel.send({
        embeds: [
          createEmbed(
            0xff0000,
            `${cross} Please provide a subcommand: \`add\`, \`remove\`, or \`list\`.`,
            message.author,
            client,
            "user", // Dynamic thumbnail for the user running the command
            null // No image in this case
          ),
        ],
      });
    }

    switch (subCommand) {
      case "add": {
        const userId = args[0]?.replace(/[<@!>]/g, ""); // Extract user ID from mention
        if (!userId) {
          return message.channel.send({
            embeds: [
              createEmbed(0xff0000, `${cross} Please mention a user to add.`, message.author, client, "user", null),
            ],
          });
        }
        if (noPrefixUsers.includes(userId)) {
          return message.channel.send({
            embeds: [
              createEmbed(0xffff00, `${cross} This user is already in the no-prefix list.`, message.author, client, "user", null),
            ],
          });
        }

        noPrefixUsers.push(userId);
        fs.writeFileSync(noPrefixFilePath, JSON.stringify({ noPrefixUsers }, null, 2));
        return message.channel.send({
          embeds: [
            createEmbed(
              0x00ff00,
              `${tick} <@${userId}> has been added to the no-prefix list.`,
              message.author,
              client,
              "server", // Dynamic thumbnail with server icon
              null // No image in this case
            ),
          ],
        });
      }

      case "remove": {
        const userId = args[0]?.replace(/[<@!>]/g, ""); // Extract user ID from mention
        if (!userId) {
          return message.channel.send({
            embeds: [
              createEmbed(0xff0000, `${cross} Please mention a user to remove.`, message.author, client, "user", null),
            ],
          });
        }
        const index = noPrefixUsers.indexOf(userId);
        if (index === -1) {
          return message.channel.send({
            embeds: [
              createEmbed(
                0xffff00,
                `${cross} This user is not in the no-prefix list.`,
                message.author,
                client,
                "user", // Dynamic thumbnail with user avatar
                null // No image in this case
              ),
            ],
          });
        }

        noPrefixUsers.splice(index, 1);
        fs.writeFileSync(noPrefixFilePath, JSON.stringify({ noPrefixUsers }, null, 2));
        return message.channel.send({
          embeds: [
            createEmbed(
              0x00ff00,
              `${tick} <@${userId}> has been removed from the no-prefix list.`,
              message.author,
              client,
              "server", // Dynamic thumbnail with server icon
              null // No image in this case
            ),
          ],
        });
      }

      case "list": {
        if (noPrefixUsers.length === 0) {
          return message.channel.send({
            embeds: [
              createEmbed(0xffff00, `${cross} The no-prefix list is empty.`, message.author, client, "user", null),
            ],
          });
        }
        const userList = noPrefixUsers.map((id) => `<@${id}>`).join(", ");
        return message.channel.send({
          embeds: [
            createEmbed(
              0x0000ff,
              `${next} **No-prefix users:** ${userList}`,
              message.author,
              client,
              "server", // Dynamic thumbnail with server icon
              null // No image in this case
            ),
          ],
        });
      }

      default: {
        return message.channel.send({
          embeds: [
            createEmbed(
              0xff0000,
              `${cross} Invalid subcommand. Use \`add\`, \`remove\`, or \`list\`.`,
              message.author,
              client,
              "user", // Dynamic thumbnail with user avatar
              null // No image in this case
            ),
          ],
        });
      }
    }
  },
};