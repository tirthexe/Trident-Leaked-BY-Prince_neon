const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const emoji = require("../../emoji");

module.exports = {
  name: "list",
  description: "List admins, roles, members in a role, bots, or bans.",
  async execute(client, message, args) {
    const executor = message.author;
    const option = args[0]?.toLowerCase();
    const pageSize = 15;
    let data = [];
    let title = "";

    // Fetch data based on the command option
    switch (option) {
      case "admins":
        data = message.guild.members.cache
          .filter((member) => member.permissions.has(PermissionsBitField.Flags.Administrator))
          .map((member) => `<@${member.user.id}>`);
        title = "Admins";
        break;

      case "roles":
        data = message.guild.roles.cache
          .filter(role => role.id !== message.guild.id) // exclude @everyone
          .sort((a, b) => b.position - a.position)
          .map((role, index) => `> <@&${role.id}> (${role.id})`);
        title = "Roles";
        break;

      case "inrole":
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
        if (!role) {
          return message.channel.send(
            `${emoji.error} Please mention a valid role or provide a valid role ID.`
          ).then((msg) => setTimeout(() => msg.delete(), 5000));
        }
        data = role.members.map((member) => `<@${member.user.id}>`);
        title = `Members in ${role.name}`;
        break;

      case "bans":
        const bans = await message.guild.bans.fetch();
        data = bans.map((ban) => `<@${ban.user.id}>`);
        title = "Bans";
        break;

      case "bots":
        data = message.guild.members.cache
          .filter(member => member.user.bot)
          .map(bot => `<@${bot.id}> (${bot.id})`);
        title = "Bots";
        break;

      default:
        return message.channel.send(
          `${emoji.error} Please choose one: \`admins\`, \`roles\`, \`inrole [role]\`, \`bans\`, or \`bots\`.`
        ).then((msg) => setTimeout(() => msg.delete(), 5000));
    }

    if (!data.length) {
      return message.channel.send(
        `${emoji.error} No data found for **${title}**.`
      ).then((msg) => setTimeout(() => msg.delete(), 5000));
    }

    // Pagination setup
    let currentPage = 0;

    const generateEmbed = () => {
      const start = currentPage * pageSize;
      const end = start + pageSize;
      const pageData = data.slice(start, end);

      const totalPages = Math.ceil(data.length / pageSize);

      const embed = new EmbedBuilder()
        .setColor("#00FF00")
        .setDescription(
          `List for **${title}**\n> Total ${title.toLowerCase()} = **${data.length}**\n\n` +
            pageData.map((item, index) => `${start + index + 1}. ${item}`).join("\n")
        )
        .setFooter({
          text: `Page ${currentPage + 1} of ${totalPages}`,
          iconURL: client.user.displayAvatarURL(),
        });

      return embed;
    };

    // Button setup
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("first")
        .setEmoji(emoji.previous)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("previous")
        .setEmoji(emoji.previous)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("stop")
        .setEmoji(emoji.stop)
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("next")
        .setEmoji(emoji.next)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("last")
        .setEmoji(emoji.next)
        .setStyle(ButtonStyle.Primary)
    );

    const messageInstance = await message.channel.send({
      embeds: [generateEmbed()],
      components: [row],
    });

    // Collector for button interaction
    const collector = messageInstance.createMessageComponentCollector({
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== executor.id) {
        return interaction.reply({
          content: `${emoji.error} This button is not for you!`,
          ephemeral: true,
        });
      }

      switch (interaction.customId) {
        case "first":
          currentPage = 0;
          break;
        case "previous":
          if (currentPage > 0) currentPage--;
          break;
        case "stop":
          collector.stop();
          return interaction.update({ components: [] });
        case "next":
          if ((currentPage + 1) * pageSize < data.length) currentPage++;
          break;
        case "last":
          currentPage = Math.floor((data.length - 1) / pageSize);
          break;
      }

      await interaction.update({ embeds: [generateEmbed()] });
    });

    collector.on("end", () => {
      messageInstance.edit({ components: [] });
    });
  },
};