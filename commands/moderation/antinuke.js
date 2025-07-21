const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const AntiNukeAndWhitelist = require('../../database/Antinuke');
const emoji = require('../../emoji');

module.exports = {
  name: 'antinuke',
  description: 'Enable or disable AntiNuke protection.',
  async execute(client, message, args) {
    if (message.guild.ownerId !== message.author.id) {
      const embed = new EmbedBuilder()
        .setTitle("Permission Denied!")
        .setDescription(`${emoji.cross} | TAKE OWNERSHIP FIRST THEN COME TO ME.`)
        .setFooter({ text: "TRIDENT™", iconURL: message.guild.iconURL() })
        .setTimestamp()
        .setColor("Red");

      return message.reply({ embeds: [embed] });
    }

    if (!args.length) {
      const settings = await AntiNukeAndWhitelist.findOne({ guildId: message.guild.id });
      const status = settings?.enabled ? 'ENABLED' : 'DISABLED';

      const embed = new EmbedBuilder()
        .setTitle(`Antinuke ${status}`)
        .setDescription(
          settings?.enabled
            ? "Antinuke is active! Your server is now protected from unwhitelisted admin actions."
            : "Antinuke is currently disabled. Enable it to protect your server."
        )
        .addFields(
          { name: "__FOR ENABLE__", value: "``ANTINUKE ENABLE``", inline: true },
          { name: "__FOR DISABLE__", value: "``ANTINUKE DISABLE``", inline: true }
        )
        .setFooter({ text: "TRIDENT", iconURL: message.guild.iconURL() })
        .setTimestamp()
        .setThumbnail(client.user.displayAvatarURL())
        .setColor(settings?.enabled ? "Green" : "Red");

      return message.reply({ embeds: [embed] });
    }

    if (!['enable', 'disable'].includes(args[0])) {
      return message.reply(`${emoji.cross} Please specify \`enable\` or \`disable\` to toggle AntiNuke.`);
    }

    let settings = await AntiNukeAndWhitelist.findOne({ guildId: message.guild.id });
    if (!settings) {
      settings = new AntiNukeAndWhitelist({
        guildId: message.guild.id,
        enabled: false,
        whitelist: [],
        actions: [],
      });
    }

    if (args[0] === 'enable') {
      const botMember = message.guild.members.me;
      const botPermissions = botMember.permissions;
      const botRolePosition = botMember.roles.highest.position;
      const topRolesAboveBot = message.guild.roles.cache.filter(r => r.position > botRolePosition).size;

      let steps = [
        { text: "Initializing Quick Setup!", check: true },
        { text: "Verifying the necessary permissions...", check: botPermissions.has(PermissionsBitField.Flags.Administrator) },
        { text: "Checking Trident's role position for optimal configuration...", check: topRolesAboveBot <= 7 },
        { text: "Crafting and configuring setting for your server...", check: true },
        { text: "Config Database and antinuke system for your server...", check: true },
        { text: "Safeguarding your changes...", check: true },
        { text: "Activating the Antinuke Modules for enhanced security...!!", check: true }
      ];

      let progressEmbed = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${emoji.loading} ${steps[0].text}`)
            .setFooter({ text: "TRIDENT", iconURL: message.guild.iconURL() })
            .setTimestamp()
            .setColor("Yellow")
        ]
      });

      for (let i = 1; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await progressEmbed.edit({
          embeds: [
            new EmbedBuilder()
              .setDescription(steps.slice(0, i + 1).map(step => `${step.check ? emoji.tick : emoji.cross} | ${step.text}`).join("\n"))
              .setFooter({ text: "TRIDENT", iconURL: message.guild.iconURL() })
              .setTimestamp()
              .setColor(steps[i].check ? "Green" : "Red")
          ]
        });
      }
    }

    settings.enabled = args[0] === 'enable';
    await settings.save();

    const statusEmbed = new EmbedBuilder()
      .setTitle(`Antinuke ${settings.enabled ? 'ENABLED' : 'DISABLED'}`)
      .setDescription(
        settings.enabled
          ? "Your server is now protected! No unwhitelisted admins can perform harmful actions."
          : "Antinuke has been disabled. Use `enable` to reactivate it."
      )
      .setFooter({ text: "TRIDENT", iconURL: message.guild.iconURL() })
      .setTimestamp()
      .setThumbnail(client.user.displayAvatarURL())
      .setColor(settings.enabled ? "Green" : "Red");

    message.reply({ embeds: [statusEmbed] });
  },
};