const { PermissionsBitField } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "role",
  description: "Assigns or removes a role from a user.",
  aliases:["R"], 
  async execute(client, message, args) {
    try {
      // Permission check
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | You do not have permission to manage roles.`,
              message.author,
              client,
              null
            ),
          ],
        });
      }

      // Argument check
      if (args.length < 2) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | Please provide a user and a role.`,
              message.author,
              client,
              null
            ),
          ],
        });
      }

      const user = message.mentions.members.first();
      if (!user) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | Please mention a valid user.`,
              message.author,
              client,
              null
            ),
          ],
        });
      }

      const roleIdentifier = args.slice(1).join(" ");
      const roles = findMatchingRoles(message.guild, roleIdentifier);

      if (roles.length === 0) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | No role found with the identifier **${roleIdentifier}**.`,
              message.author,
              client,
              null
            ),
          ],
        });
      }

      const role = roles[0];

      // Check if the bot can manage the role
      if (
        role.position >= message.guild.members.me.roles.highest.position
      ) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | I cannot manage the ${role}. It may be higher than my highest role.`,
              message.author,
              client,
              null
            ),
          ],
        });
      }

      // Role hierarchy check for the user
      if (
        role.position >= message.member.roles.highest.position &&
        message.guild.ownerId !== message.member.id
      ) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} | You cannot manage the ${role} because it is higher or equal to your highest role.`,
              message.author,
              client,
              null
            ),
          ],
        });
      }

      const action = user.roles.cache.has(role.id) ? "removed" : "added";
      if (action === "removed") {
        await user.roles.remove(role, `Removed by ${message.author.tag}`);
      } else {
        await user.roles.add(role, `Added by ${message.author.tag}`);
      }

      return message.reply({
        embeds: [
          createEmbed(
            "#00FF00",
            `${emoji.tick} | Successfully ${action} ${role} ${action === "added" ? "to" : "from"} ${user}.`,
            message.author,
            client,
            null
          ),
        ],
      });
    } catch (error) {
      console.error("Error managing role:", error);
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} | There was an error trying to manage the role.`,
            message.author,
            client,
            null
          ),
        ],
      });
    }
  },
};

function findMatchingRoles(guild, query) {
  const ROLE_MENTION = /<?@?&?(\d{17,20})>?/;
  if (!guild || !query || typeof query !== "string") return [];

  const patternMatch = query.match(ROLE_MENTION);
  if (patternMatch) {
    const id = patternMatch[1];
    const role = guild.roles.cache.find((r) => r.id === id);
    if (role) return [role];
  }

  const exact = [];
  const startsWith = [];
  const includes = [];
  guild.roles.cache.forEach((role) => {
    const lowerName = role.name.toLowerCase();
    if (role.name === query) exact.push(role);
    if (lowerName.startsWith(query.toLowerCase())) startsWith.push(role);
    if (lowerName.includes(query.toLowerCase())) includes.push(role);
  });

  return exact.length ? exact : startsWith.length ? startsWith : includes;
}