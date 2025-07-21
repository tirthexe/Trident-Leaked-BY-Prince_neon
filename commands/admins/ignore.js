const fs = require("fs");
const path = require("path");

const ignoredChannelsPath = path.join(__dirname, "../../ignoredChannels.json");

let ignoredData = {};
if (fs.existsSync(ignoredChannelsPath)) {
  ignoredData = JSON.parse(fs.readFileSync(ignoredChannelsPath, "utf-8"));
}

module.exports = {
  name: "ignore",
  description: "Manage ignored channels and bypass roles.",
  execute(client, message, args) {
    if (
      message.author.id !== message.guild.ownerId &&
      !message.member.permissions.has("Administrator")
    ) {
      return message.channel.send("You do not have permission to use this command.");
    }

    const guildId = message.guild.id;
    if (!ignoredData[guildId]) {
      ignoredData[guildId] = { ignoredChannels: [], bypassRoles: [] };
    }

    const subCommand = args[0]?.toLowerCase();
    if (!subCommand) {
      return message.channel.send(
        "Please specify a subcommand: `add`, `remove`, `list`.\nExample: `ignore add channel #channel`, `ignore add role @role`."
      );
    }

    switch (subCommand) {
      case "add": {
        const type = args[1]?.toLowerCase();
        const mention = args[2];

        if (!type || !["channel", "role"].includes(type)) {
          return message.channel.send("Specify `channel` or `role` to add.");
        }

        if (!mention) {
          return message.channel.send("Mention a channel or role to add.");
        }

        if (type === "channel") {
          const channelId = mention.replace(/[<#>]/g, "");
          if (!message.guild.channels.cache.has(channelId)) {
            return message.channel.send("Invalid channel mention.");
          }

          if (!ignoredData[guildId].ignoredChannels.includes(channelId)) {
            ignoredData[guildId].ignoredChannels.push(channelId);
            saveIgnoredData();
            return message.channel.send(`<#${channelId}> added to ignored channels.`);
          } else {
            return message.channel.send("Channel already ignored.");
          }
        }

        if (type === "role") {
          const roleId = mention.replace(/[<@&>]/g, "");
          if (!message.guild.roles.cache.has(roleId)) {
            return message.channel.send("Invalid role mention.");
          }

          if (!ignoredData[guildId].bypassRoles.includes(roleId)) {
            ignoredData[guildId].bypassRoles.push(roleId);
            saveIgnoredData();
            return message.channel.send(`<@&${roleId}> added to bypass roles.`);
          } else {
            return message.channel.send("Role already in bypass list.");
          }
        }
        break;
      }

      case "remove": {
        const type = args[1]?.toLowerCase();
        const mention = args[2];

        if (!type || !["channel", "role"].includes(type)) {
          return message.channel.send("Specify `channel` or `role` to remove.");
        }

        if (!mention) {
          return message.channel.send("Mention a channel or role to remove.");
        }

        if (type === "channel") {
          const channelId = mention.replace(/[<#>]/g, "");
          const index = ignoredData[guildId].ignoredChannels.indexOf(channelId);

          if (index !== -1) {
            ignoredData[guildId].ignoredChannels.splice(index, 1);
            saveIgnoredData();
            return message.channel.send(`<#${channelId}> removed from ignored channels.`);
          } else {
            return message.channel.send("Channel not in ignored list.");
          }
        }

        if (type === "role") {
          const roleId = mention.replace(/[<@&>]/g, "");
          const index = ignoredData[guildId].bypassRoles.indexOf(roleId);

          if (index !== -1) {
            ignoredData[guildId].bypassRoles.splice(index, 1);
            saveIgnoredData();
            return message.channel.send(`<@&${roleId}> removed from bypass roles.`);
          } else {
            return message.channel.send("Role not in bypass list.");
          }
        }
        break;
      }

      case "list": {
        const { ignoredChannels, bypassRoles } = ignoredData[guildId];
        const ignoredChannelsList = ignoredChannels.map((id) => `<#${id}>`).join(", ") || "None";
        const bypassRolesList = bypassRoles.map((id) => `<@&${id}>`).join(", ") || "None";

        return message.channel.send(
          `**Ignored Channels:** ${ignoredChannelsList}\n**Bypass Roles:** ${bypassRolesList}`
        );
      }

      default:
        return message.channel.send("Invalid subcommand. Use `add`, `remove`, or `list`.");
    }
  },
};

// Save ignored data
function saveIgnoredData() {
  fs.writeFileSync(ignoredChannelsPath, JSON.stringify(ignoredData, null, 2));
}