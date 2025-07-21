const { PermissionsBitField } = require("discord.js");
const emoji = require("../../emoji");

module.exports = {
  name: "purge",
  aliases: ["p", "c"],
  description: "Delete messages based on count or filter criteria.",
  async execute(client, message, args) {
    const executor = message.author;

    // Check if the user has 'Manage Messages' permission
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.channel.send(
        `${emoji.error} | You don't have permission to use this command.`
      ).then((msg) => setTimeout(() => msg.delete(), 5000));
    }

    // Check if the bot has 'Manage Messages' permission
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.channel.send(
        `${emoji.error} | I don't have permission to manage messages.`
      ).then((msg) => setTimeout(() => msg.delete(), 5000));
    }

    let limit;
    let filterType;

    // **Agar koi argument nahi diya toh prompt karega**
    if (args.length === 0) {
      return message.channel.send(
        `${emoji.error} | Choose one: \`media\`, \`user\`, \`emoji\`, \`sticker\`, \`link\`, or a message count.`
      ).then((msg) => setTimeout(() => msg.delete(), 5000));
    }

    // Parse arguments
    const firstArg = args[0].toLowerCase();

    if (!isNaN(firstArg)) {
      limit = Math.min(parseInt(firstArg), 100);
    } else {
      filterType = firstArg;
      if (args[1] && !isNaN(args[1])) {
        limit = Math.min(parseInt(args[1]), 100);
      }
    }

    // Fetch messages to filter
    const messages = await message.channel.messages.fetch({ limit: limit || 100 });

    if (!filterType) {
      try {
        const deletedMessages = await message.channel.bulkDelete(limit, true);
        return message.channel.send(
          `${emoji.tick} | Successfully deleted **${deletedMessages.size}** messages.`
        ).then((msg) => setTimeout(() => msg.delete(), 5000));
      } catch (error) {
        console.error(error);
        return message.channel.send(
          `${emoji.error} | There was an error trying to purge messages.`
        ).then((msg) => setTimeout(() => msg.delete(), 5000));
      }
    }

    // Filter messages based on criteria
    let filteredMessages;

    switch (filterType) {
      case "media":
        filteredMessages = messages.filter((msg) => msg.attachments.size > 0);
        break;

      case "user":
        const userMention = message.mentions.users.first();
        if (!userMention) {
          return message.channel.send(
            `${emoji.error} | Please mention a user to purge their messages.`
          ).then((msg) => setTimeout(() => msg.delete(), 5000));
        }
        filteredMessages = messages.filter((msg) => msg.author.id === userMention.id);
        break;

      case "emoji":
        filteredMessages = messages.filter((msg) => /<a?:\w+:\d+>/.test(msg.content));
        break;

      case "sticker":
        filteredMessages = messages.filter((msg) => msg.stickers.size > 0);
        break;

      case "link":
        filteredMessages = messages.filter((msg) => /(https?:\/\/[^\s]+)/g.test(msg.content));
        break;

      default:
        return message.channel.send(
          `${emoji.error} | Invalid option. Choose \`media\`, \`user\`, \`emoji\`, \`sticker\`, or \`link\`.`
        ).then((msg) => setTimeout(() => msg.delete(), 5000));
    }

    // Bulk delete filtered messages
    try {
      const deletedMessages = await message.channel.bulkDelete(filteredMessages, true);
      return message.channel.send(
        `${emoji.tick} | Successfully deleted **${deletedMessages.size}** messages.`
      ).then((msg) => setTimeout(() => msg.delete(), 5000));
    } catch (error) {
      console.error(error);
      return message.channel.send(
        `${emoji.error} | There was an error trying to purge messages.`
      ).then((msg) => setTimeout(() => msg.delete(), 5000));
    }
  },
};