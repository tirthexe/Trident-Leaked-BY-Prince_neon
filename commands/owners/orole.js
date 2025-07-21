const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");
const { ownerID } = require("../../owner");

module.exports = {
  name: "orole",
  description: "Forcefully assigns or removes a role from a user (Owner only).",
  async execute(client, message, args) {
    try {
      // Check if the user is the bot owner
      if (message.author.id !== ownerID) return;

      // Validate arguments
      if (args.length < 2) {
        return message.reply({
          embeds: [
            createEmbed(
              "#FF0000",
              `${emoji.error} Please provide a user and a role.`,
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
              `${emoji.error} Please mention a valid user.`,
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
              `${emoji.error} No role found with the identifier **${roleIdentifier}**.`,
              message.author,
              client,
              null
            ),
          ],
        });
      }

      const role = roles[0];

      // Bypass role hierarchy and permissions
      const action = user.roles.cache.has(role.id) ? "removed" : "added";
      if (action === "removed") {
        await user.roles.remove(role, `Forcefully removed by ${message.author.tag}`);
      } else {
        await user.roles.add(role, `Forcefully added by ${message.author.tag}`);
      }

      // Send embed confirmation
      return message.reply({
        embeds: [
          createEmbed(
            "#00FF00",
            `${emoji.tick} Successfully ${action} **${role.name}** ${
              action === "added" ? "to" : "from"
            } **${user.user.tag}**.`,
            message.author,
            client,
            null
          ),
        ],
      });
    } catch (error) {
      console.error("Error in orole command:", error);
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} There was an error managing the role.`,
            message.author,
            client,
            null
          ),
        ],
      });
    }
  },
};

// Helper function to fetch matching roles
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