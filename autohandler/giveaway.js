const { Collection, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const Giveaway = require("../database/Giveaway");
const emoji = require("../emoji");

module.exports = async (client) => {
  const interval = 3000; // 3 seconds
  const running = new Collection();

  setInterval(async () => {
    const now = new Date();

    const giveaways = await Giveaway.find({
      endTime: { $lte: now },
    });

    for (const giveaway of giveaways) {
      if (running.has(giveaway.messageId)) continue;
      running.set(giveaway.messageId, true);

      const guild = client.guilds.cache.get(giveaway.guildId);
      if (!guild) {
        await Giveaway.deleteOne({ messageId: giveaway.messageId });
        running.delete(giveaway.messageId);
        continue;
      }

      const channel = guild.channels.cache.get(giveaway.channelId);
      if (!channel) {
        await Giveaway.deleteOne({ messageId: giveaway.messageId });
        running.delete(giveaway.messageId);
        continue;
      }

      let msg;
      try {
        msg = await channel.messages.fetch(giveaway.messageId);
      } catch (err) {
        if (err.code === 10008 || err.code === 50001 || err.code === 50013) {
          await Giveaway.deleteOne({ messageId: giveaway.messageId });
          running.delete(giveaway.messageId);
          continue;
        } else {
          console.error(`Error fetching message ${giveaway.messageId}:`, err);
          running.delete(giveaway.messageId);
          continue;
        }
      }

      try {
        const reaction = msg.reactions.cache.find(
          (r) => r.emoji.toString() === emoji.dreact
        );

        if (!reaction) {
          await msg.reply("No participants found.");
          await Giveaway.deleteOne({ messageId: giveaway.messageId });
          continue;
        }

        const users = await reaction.users.fetch();
        const entrants = users.filter((u) => !u.bot).map((u) => u.id);

        if (entrants.length < giveaway.winnerCount) {
          await msg.reply(`Not enough participants to draw **${giveaway.winnerCount}** winner(s).`);
          await Giveaway.deleteOne({ messageId: giveaway.messageId });
          continue;
        }

        const winners = [];
        while (winners.length < giveaway.winnerCount) {
          const rand = entrants[Math.floor(Math.random() * entrants.length)];
          if (!winners.includes(rand)) winners.push(rand);
        }

        // Build the "See Giveaway" button
        const giveawayLink = `https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}`;
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("See Giveaway")
            .setStyle(ButtonStyle.Link)
            .setURL(giveawayLink)
        );

        // Send the win message with host and button
        await msg.reply({
          content: `Congratulations ${winners.map((w) => `<@${w}>`).join(", ")}! You won **${giveaway.prize}** ${emoji.gift}\nHosted by <@${giveaway.hostedBy}>`,
          components: [row],
        });

        await Giveaway.deleteOne({ messageId: giveaway.messageId });
      } catch (err) {
        console.error(`Failed to finish giveaway ${giveaway.messageId}:`, err);
      }

      running.delete(giveaway.messageId);
    }
  }, interval);
};
