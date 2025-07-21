const { MessageEmbed } = require("discord.js");
const Blacklist = require("../../database/Blacklist");

module.exports = {
  name: "blacklist",
  description: "Add or remove blacklisted channels and bypass roles.",
  usage: "[add/remove] [channel/role] <#channel/@role>",
  async execute(client, message, args) {
    // Check if the user has the "Administrator" permission
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply("You need `Administrator` permissions to use this command.");
    }

    const action = args[0];
    const type = args[1];
    const target = args[2];

    if (!action || !type || !target) {
      return message.reply("Please specify an action (add/remove), type (channel/role), and the target.");
    }

    const guildId = message.guild.id;
    const guildConfig = await Blacklist.findOne({ guildId });

    // If the guild doesn't have any blacklist config, create one
    if (!guildConfig) {
      await Blacklist.create({ guildId });
    }

    const updatedConfig = await Blacklist.findOne({ guildId });

    if (type === "channel") {
      const channel = message.guild.channels.cache.get(target.replace(/[<#>]/g, ""));
      if (!channel) return message.reply("Invalid channel!");

      if (action === "add") {
        // Add to blacklist if not already
        if (updatedConfig.blacklistedChannels.includes(channel.id)) {
          return message.reply("This channel is already blacklisted.");
        }
        updatedConfig.blacklistedChannels.push(channel.id);
        await updatedConfig.save();
        return message.reply(`Channel ${channel.name} has been added to the blacklist.`);
      } else if (action === "remove") {
        // Remove from blacklist if it exists
        const index = updatedConfig.blacklistedChannels.indexOf(channel.id);
        if (index === -1) {
          return message.reply("This channel is not blacklisted.");
        }
        updatedConfig.blacklistedChannels.splice(index, 1);
        await updatedConfig.save();
        return message.reply(`Channel ${channel.name} has been removed from the blacklist.`);
      }
    } else if (type === "role") {
      const role = message.guild.roles.cache.get(target.replace(/[<@&>]/g, ""));
      if (!role) return message.reply("Invalid role!");

      if (action === "add") {
        // Add to bypass roles if not already
        if (updatedConfig.bypassRoles.includes(role.id)) {
          return message.reply("This role already has bypass access.");
        }
        updatedConfig.bypassRoles.push(role.id);
        await updatedConfig.save();
        return message.reply(`Role ${role.name} has been added to the bypass list.`);
      } else if (action === "remove") {
        // Remove from bypass roles if it exists
        const index = updatedConfig.bypassRoles.indexOf(role.id);
        if (index === -1) {
          return message.reply("This role does not have bypass access.");
        }
        updatedConfig.bypassRoles.splice(index, 1);
        await updatedConfig.save();
        return message.reply(`Role ${role.name} has been removed from the bypass list.`);
      }
    } else {
      return message.reply("Invalid type. Use `channel` or `role`.");
    }
  },
};