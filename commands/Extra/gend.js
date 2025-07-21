const {
  PermissionsBitField,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const Giveaway = require("../../database/Giveaway");
const emoji = require("../../emoji");

module.exports = {
  name: "gend",
  aliases: ["giveawayend", "end"],
  description: "Force end a giveaway and pick winners",
  async execute(client, message, args) {
    if (
      !message.guild ||
      !message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)
    ) {
      return message.reply({
        content: "You need the **Manage Messages** permission to use this command.",
      });
    }

    let targetMessage;
    let messageId;

    if (message.reference) {
      const replyMsg = await message.channel.messages
        .fetch(message.reference.messageId)
        .catch(() => null);
      if (!replyMsg) return message.reply({ content: "Failed to fetch the replied message." });
      messageId = replyMsg.id;
      targetMessage = replyMsg;
    } else if (args[0]) {
      messageId = args[0];
      targetMessage = await message.channel.messages.fetch(messageId).catch(() => null);
      if (!targetMessage) {
        return message.reply({ content: "Message not found in this channel." });
      }
    } else {
      return message.reply({
        content: "Please reply to a giveaway message or provide a message ID.\nExample: `gend <messageID>`",
      });
    }

    const giveaway = await Giveaway.findOne({ messageId });
    if (!giveaway) {
      return message.reply({
        content: "No giveaway found in the database with this message ID.",
      });
    }

    const guild = await client.guilds.fetch(giveaway.guildId).catch(() => null);
    const channel = await guild?.channels.fetch(giveaway.channelId).catch(() => null);
    const giveawayMessage = await channel?.messages.fetch(giveaway.messageId).catch(() => null);

    if (!guild || !channel || !giveawayMessage) {
      return message.reply({
        content: "Unable to fetch the giveaway message. It may have been deleted.",
      });
    }

    await giveawayMessage.fetch();
    const reaction = giveawayMessage.reactions.cache.get(emoji.react);
    if (!reaction) {
      return message.reply({ content: "No reactions found on the giveaway message." });
    }

    const users = await reaction.users.fetch().catch(() => null);
    if (!users) {
      return message.reply({ content: "Failed to fetch users who reacted." });
    }

    const validUsers = users.filter((u) => !u.bot);
    const entrants = [...validUsers.values()];

    if (!entrants.length) {
      return message.reply({ content: "No valid entries found to pick winners." });
    }

    const winners = [];
    const winnerCount = Math.min(giveaway.winnerCount, entrants.length);

    for (let i = 0; i < winnerCount; i++) {
      const randomIndex = Math.floor(Math.random() * entrants.length);
      winners.push(entrants.splice(randomIndex, 1)[0]);
    }

    const viewButton = new ButtonBuilder()
      .setLabel("View Giveaway")
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}`);

    const row = new ActionRowBuilder().addComponents(viewButton);

    await message.channel.send({
      content: `${emoji.dreact} Congratulations ${winners.map(w => `<@${w.id}>`).join(", ")}! You won **${giveaway.prize}**!`,
      components: [row],
    });

    // Step: Delete giveaway from database
    await Giveaway.deleteOne({ messageId }).catch(() => null);
  },
};