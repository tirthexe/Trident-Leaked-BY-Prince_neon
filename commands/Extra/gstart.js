const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const ms = require("ms");
const Giveaway = require("../../database/Giveaway");
const Gimage = require("../../database/Gimage");
const emoji = require("../../emoji");

module.exports = {
  name: "gstart",
  aliases: ["giveawaystart"],
  description: "Start a giveaway",
  async execute(client, message, args) {
    if (!message.guild) return;

    const hasPermission = message.member.permissions.has(PermissionsBitField.Flags.ManageMessages);
    const modRole = message.guild.roles.cache.find(role => role.name === "TRIDENT OP");
    const hasModRole = modRole && message.member.roles.cache.has(modRole.id);

    if (!hasPermission && !hasModRole) {
      return message.reply({
        content: "You need the `Manage Messages` permission or the `TRIDENT MOD` role to use this command.",
      });
    }

    if (!args[0] || !args[1] || args.length < 3) {
      return message.reply({
        content: "Usage: `Gstart <time> <winners> <prize>`\nExample: `Gstart 1m 1 Nitro`",
      });
    }

    const [time, winners, ...prizeArr] = args;
    const duration = ms(time);
    const winnerCount = parseInt(winners);
    const prize = prizeArr.join(" ");

    if (!duration || isNaN(winnerCount)) {
      return message.reply({
        content: "Please provide a **valid time** (e.g. 1m, 1h) and **winner count** (e.g. 1, 2).",
      });
    }

    await message.delete().catch(() => {});

    const endTime = Date.now() + duration;
    const endDate = new Date(endTime);
    const localeTime = endDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const gimageData = await Gimage.findOne({ guildId: message.guild.id });

    const embed = new EmbedBuilder()
      .setTitle(`${emoji.gift} ${prize} ${emoji.gift}`)
      .setDescription(
        `${emoji.dot} **Winners:** ${winnerCount}\n` +
        `${emoji.dot} **Ends:** <t:${Math.floor(endTime / 1000)}:R>\n` +
        `${emoji.dot} **Hosted by:** ${message.member}\n\n` +
        `${emoji.dot} React with ${emoji.dreact} to participate!`
      )
      .setColor("#ff0000")
      .setTimestamp()
      .setFooter({
        text: `TRIDENT ™ | END AT ${localeTime}`,
        iconURL: client.user.displayAvatarURL(),
      });

    if (gimageData?.image) {
      embed.setImage(gimageData.image);
    }

    try {
      const giveawayMsg = await message.channel.send({
        content: `${emoji.gift} **GIVEAWAY** ${emoji.gift}`,
        embeds: [embed],
      });

      await giveawayMsg.react(emoji.dreact);

      await Giveaway.create({
        guildId: message.guild.id,
        channelId: message.channel.id,
        messageId: giveawayMsg.id,
        prize,
        winnerCount,
        endTime: new Date(endTime),
        hostedBy: message.author.id, // Store the host
      });
    } catch (err) {
      console.error("Failed to start giveaway:", err);
      return message.reply({
        content: "Something went wrong while starting the giveaway.",
      });
    }
  },
};