const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const AutoThread = require("../database/AutoThread");

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    if (
      message.author.bot ||
      !message.guild ||
      !message.guild.available ||
      !message.content ||
      message.system
    ) return;

    const settings = await AutoThread.findOne({ guildId: message.guild.id });
    if (!settings || !settings.enabled || !settings.channelId) return;

    if (message.channel.id !== settings.channelId) return;

    try {
      if (message.hasThread) return;

      const thread = await message.startThread({
        name: message.content.slice(0, 50) || `Thread by ${message.author.username}`,
        autoArchiveDuration: 60,
        reason: `AutoThread triggered by ${message.author.tag}`,
      });

      const role = settings.role ? `<@&${settings.roleId}>` : 'support team';

      await thread.send({
        content: `**Thanks for writing <@${message.author.id}>! Our ${role} members will assist you shortly**.`,
        embeds: [
          new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription('Want to close this thread?\nClick the button below.')
            .setFooter({ text: 'TRIDENT ❤ DEVELOPMENT', iconURL: client.user.displayAvatarURL() }),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`autothread_close_${message.author.id}`)
              .setLabel('Close')
              .setStyle(ButtonStyle.Danger)
          ),
        ],
      });

      const filter = (interaction) =>
        interaction.customId === `autothread_close_${message.author.id}` &&
        (interaction.user.id === message.author.id ||
          (settings.role && interaction.member.roles.cache.has(settings.role)));

      const collector = thread.createMessageComponentCollector({ filter, time: 86400000 });

      collector.on('collect', async (interaction) => {
        await interaction.reply({
          content: `This thread has been closed by ${interaction.user}.`,
          ephemeral: false,
        });

        await thread.setLocked(true);
        await thread.setArchived(true);
      });

    } catch (err) {
      console.error("Error creating thread:", err);
    }
  });
};