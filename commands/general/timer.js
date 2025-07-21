const { PermissionsBitField } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "timer",
  description: "Set a timer with a reason.",
  async execute(client, message, args) {
    const executor = message.author;

    // Ensure arguments are provided
    if (!args[0]) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} Please provide a valid time and reason.\n\n**Usage:** \`timer <time> <reason>\`\nExample: \`timer 1h test\``,
            executor,
            client,
            null
          ),
        ],
      });
    }

    const timeInput = args[0].toLowerCase();
    const reason = args.slice(1).join(" ") || "No reason provided";

    // Parse the time (e.g., 1h, 30m, 2d, etc.)
    const timeMatch = timeInput.match(/^(\d+)([smhdw])$/);
    if (!timeMatch) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} Invalid time format. Use \`s\` for seconds, \`m\` for minutes, \`h\` for hours, \`d\` for days, or \`w\` for weeks.\n\n**Usage:** \`timer <time> <reason>\`\nExample: \`timer 1h test\``,
            executor,
            client,
            null
          ),
        ],
      });
    }

    const [, amount, unit] = timeMatch;
    const timeInSeconds = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
      w: 604800,
    }[unit] * parseInt(amount);

    const futureTimestamp = Math.floor(Date.now() / 1000) + timeInSeconds; // Current timestamp + time in seconds

    // Send the embed with the timer and reason
    return message.reply({
      embeds: [
        createEmbed(
          "#00FF00",
          `# ${reason}\n<:timer> <t:${futureTimestamp}:R>`,
          executor,
          client,
          null
        ),
      ],
    });
  },
};