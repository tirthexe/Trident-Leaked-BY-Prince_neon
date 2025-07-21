const { ownerID, developerIDs } = require("../../owner"); // Import owner and developer IDs
const { cross, tick, next } = require("../../emoji"); // Import emojis
const { createEmbed } = require("../../embed"); // Import embed builder
const PremiumModel = require("../../database/Premium"); // MongoDB model for premium users

module.exports = {
  name: "mp",
  description: "Manage premium users (add/remove/list/reset).",
  execute: async (client, message, args) => {
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
            `${cross} Please provide a subcommand: \`add\`, \`remove\`, \`list\`, or \`reset\`.`,
            message.author,
            client,
            "user",
            null
          ),
        ],
      });
    }

    switch (subCommand) {
      case "add": {
        const userId = args[0]?.replace(/[<@!>]/g, ""); // Extract user ID from mention
        const duration = args[1]?.toLowerCase(); // Duration: `1m`, `2m`, `3y`, `lifetime`
        const serverLimit = args[2]?.toLowerCase(); // Server limit: `1`, `2`, `unlimited`

        if (!userId || !duration || !serverLimit) {
          return message.channel.send({
            embeds: [
              createEmbed(
                0xff0000,
                `${cross} Usage: \`premium add @user/userid [duration: 1m/2m/3y/lifetime] [servers: 1/2/unlimited]\`.`,
                message.author,
                client,
                "user",
                null
              ),
            ],
          });
        }

        const validDurations = ["1m", "2m", "3m", "6m", "1y", "2y", "3y", "lifetime", "lyf"];
        if (!validDurations.includes(duration)) {
          return message.channel.send({
            embeds: [
              createEmbed(
                0xff0000,
                `${cross} Invalid duration. Use \`1m\`, \`2m\`, \`3m\`, \`6m\`, \`1y\`, \`2y\`, \`3y\`, \`lifetime\` or \`lyf\`.`,
                message.author,
                client,
                "user",
                null
              ),
            ],
          });
        }

        const servers = serverLimit === "unlimited" || serverLimit === "un" ? "Unlimited" : parseInt(serverLimit);
        if (!servers || (typeof servers === "number" && servers < 1)) {
          return message.channel.send({
            embeds: [
              createEmbed(
                0xff0000,
                `${cross} Invalid server limit. Use \`1\`, \`2\`, or \`unlimited\`.`,
                message.author,
                client,
                "user",
                null
              ),
            ],
          });
        }

        // Check if the user already has premium
        const existingPremium = await PremiumModel.findOne({ userId });
        if (existingPremium) {
          return message.channel.send({
            embeds: [
              createEmbed(
                0xff0000,
                `${cross} User <@${userId}> already has an active premium subscription.`,
                message.author,
                client,
                "user",
                null
              ),
            ],
          });
        }

        // Add premium user to the database
        const expiryDate =
          duration === "lifetime" || duration === "lyf"
            ? null
            : new Date(Date.now() + parseDuration(duration));

        await PremiumModel.create({
          userId,
          duration,
          servers,
          expiryDate,
        });

        return message.channel.send({
          embeds: [
            createEmbed(
              0x00ff00,
              `${tick} <@${userId}> has been added as a premium user for **${duration}** with **${servers} servers**.`,
              message.author,
              client,
              "server",
              null
            ),
          ],
        });
      }

      case "remove": {
        const userId = args[0]?.replace(/[<@!>]/g, ""); // Extract user ID from mention
        if (!userId) {
          return message.channel.send({
            embeds: [
              createEmbed(
                0xff0000,
                `${cross} Please mention a user or provide a user ID to remove.`,
                message.author,
                client,
                "user",
                null
              ),
            ],
          });
        }

        // Remove premium user from the database
        const result = await PremiumModel.findOneAndDelete({ userId });
        if (!result) {
          return message.channel.send({
            embeds: [
              createEmbed(
                0xffff00,
                `${cross} User <@${userId}> is not in the premium list.`,
                message.author,
                client,
                "user",
                null
              ),
            ],
          });
        }

        return message.channel.send({
          embeds: [
            createEmbed(
              0x00ff00,
              `${tick} <@${userId}> has been removed from the premium list.`,
              message.author,
              client,
              "server",
              null
            ),
          ],
        });
      }

      case "list": {
        const premiumUsers = await PremiumModel.find();
        if (premiumUsers.length === 0) {
          return message.channel.send({
            embeds: [
              createEmbed(
                0xffff00,
                `${cross} The premium list is empty.`,
                message.author,
                client,
                "user",
                null
              ),
            ],
          });
        }

        const userList = premiumUsers
          .map(
            (user) =>
              `<@${user.userId}> [${user.duration.toUpperCase()}] {${user.servers}}`
          )
          .join("\n");

        return message.channel.send({
          embeds: [
            createEmbed(
              0x0000ff,
              `${next} **Premium Users:**\n${userList}`,
              message.author,
              client,
              "server",
              null
            ),
          ],
        });
      }

      case "reset": {
        // Remove all premium users from the database
        await PremiumModel.deleteMany({});
        return message.channel.send({
          embeds: [
            createEmbed(
              0x00ff00,
              `${tick} All premium users have been reset. The premium list is now empty.`,
              message.author,
              client,
              "server",
              null
            ),
          ],
        });
      }

      default: {
        return message.channel.send({
          embeds: [
            createEmbed(
              0xff0000,
              `${cross} Invalid subcommand. Use \`add\`, \`remove\`, \`list\`, or \`reset\`.`,
              message.author,
              client,
              "user",
              null
            ),
          ],
        });
      }
    }
  },
};

// Helper function to parse duration
function parseDuration(duration) {
  const value = parseInt(duration.slice(0, -1));
  const unit = duration.slice(-1);
  switch (unit) {
    case "m":
      return value * 30 * 24 * 60 * 60 * 1000; // Months
    case "y":
      return value * 365 * 24 * 60 * 60 * 1000; // Years
    default:
      return 0;
  }
}