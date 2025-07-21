const { ownerID } = require("../../owner");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");
const mongoose = require("mongoose");

module.exports = {
  name: "usedatabase",
  description: "Shows the database usage (Owner only).",
  async execute(client, message) {
    try {
      if (message.author.id !== ownerID) return;

      if (!mongoose.connection || !mongoose.connection.db) {
        throw new Error("Database connection not available.");
      }

      // Alternative way to estimate size
      const collections = await mongoose.connection.db.listCollections().toArray();
      let totalSize = 0;

      for (const coll of collections) {
        const stats = await mongoose.connection.db.collection(coll.name).stats();
        totalSize += stats.size; // Add collection size
      }

      const usedMB = (totalSize / (1024 * 1024)).toFixed(2);
      const totalMB = 1000;
      const usagePercentage = ((usedMB / totalMB) * 100).toFixed(2);

      return message.reply({
        embeds: [
          createEmbed(
            "#00FFFF",
            `${emoji.info} **Database Usage:**\n\`${usagePercentage}%\` used\n\`${usedMB}MB / ${totalMB}MB\``,
            message.author,
            client,
            null
          ),
        ],
      });
    } catch (error) {
      console.error("Error in usedatabase command:", error);
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} Failed to fetch database usage.`,
            message.author,
            client,
            null
          ),
        ],
      });
    }
  },
};