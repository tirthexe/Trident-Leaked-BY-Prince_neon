const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { supportLink, inviteLink, voteLink } = require("../../link");
const { emoji1, question, music, supportEmoji, inviteEmoji, voteEmoji } = require("../../emoji");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show categorized help commands with a dropdown menu and buttons."),
  
  async execute(interaction) {
    const user = interaction.user;
    const serverIcon = interaction.guild.iconURL({ dynamic: true });
    const botThumbnail = interaction.client.user.displayAvatarURL();

    const categories = {
      General: ["botinfo", "help", "invite", "support", "badges", "bio", "userinfo", "serverinfo", "ping", "afk", "banner", "avatar", "premium", "membercount"],
      Antinuke: ["Antinuke enable", "Antinuke disable", "extraowner set", "extraowner remove", "extraowner list", "extraowner reset", "automod", "whitelist", "unwhitelist"],
      Management: ["vc kick user/all", "vc move all/user", "vc pull user", "vc mute user", "vc unmute user", "hide", "hideall", "lock", "lockall", "unlock", "unlockall", "steal", "stealall", "timer", "giveaway start", "giveaway end", "giveaway reroll"],
      Moderation: ["ban", "kick", "mute", "unban", "unmute", "unmuteall", "nick", "nuke", "role", "snipe", "reset", "list admins", "list inrole", "list roles", "list bans"],
      Setup: ["setup add", "setup remove", "setup set reqrole", "setup list"]
    };

    const mainEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription(`
[**Hey! Welcome to the help overview, I'm TRIDENT, a powerful and awesome Security Bot.**](https://discord.gg/lovers-arenaa)

${question}  __What is Trident?__  
A Next-Generation Discord Security and Management bot With Many Awesome Features, Buttons, Menus, a Context Menu, Support for Many Sources, and Customizable Settings!! 

**How to Use**  
- [Invite the Bot](https://discord.com/oauth2/authorize?client_id=1319685621396013056&permissions=41651049123792&integration_type=0&scope=bot)  
- Add in your server,  
- For security **Antinuke Enable**,  

${emoji1} **CATEGORY**  
${emoji1} **GENERAL**  
${emoji1} **ANTINUKE**  
${emoji1} **MANAGEMENT**  
${emoji1} **MODERATION**  
${emoji1} **SETUP**  
      `)
      .setThumbnail(botThumbnail)
      .setFooter({ text: "TRIDENT™ DEVELOPMENT", iconURL: serverIcon })
      .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) });

    const menu = new StringSelectMenuBuilder()
      .setCustomId("help_menu")
      .setPlaceholder("Select a category...")
      .addOptions([
        { label: "General", description: "View general commands", value: "general" },
        { label: "Antinuke", description: "View Antinuke commands", value: "Antinuke" },
        { label: "Management", description: "View Management commands", value: "Management" },
        { label: "Moderation", description: "View Moderation commands", value: "Moderation" },
        { label: "Setup", description: "View Setup commands", value: "Setup" },
        { label: "All Commands", description: "View all commands", value: "all" },
        { label: "Home", description: "Go back to the main menu", value: "home" },
      ]);

    const dropdownRow = new ActionRowBuilder().addComponents(menu);

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Support")
        .setStyle(ButtonStyle.Link)
        .setEmoji(supportEmoji)
        .setURL(supportLink),
      new ButtonBuilder()
        .setLabel("Invite")
        .setStyle(ButtonStyle.Link)
        .setEmoji(inviteEmoji)
        .setURL(inviteLink),
      new ButtonBuilder()
        .setLabel("Vote")
        .setStyle(ButtonStyle.Link)
        .setEmoji(voteEmoji)
        .setURL(voteLink)
    );

    await interaction.reply({ embeds: [mainEmbed], components: [dropdownRow, buttonRow], ephemeral: true });

    const collector = interaction.channel.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (i) => {
      if (i.user.id !== user.id) {
        return i.reply({ content: "Only the command user can use this menu.", ephemeral: true });
      }

      let updatedEmbed;

      switch (i.values[0]) {
        case "general":
          updatedEmbed = createCategoryEmbed("__**GENERAL COMMANDS**__", categories.General);
          break;
        case "Antinuke":
          updatedEmbed = createCategoryEmbed("__**ANTINUKE COMMANDS**__", categories.Antinuke);
          break;
        case "Management":
          updatedEmbed = createCategoryEmbed("__**MANAGEMENT COMMANDS**__", categories.Management);
          break;
        case "Moderation":
          updatedEmbed = createCategoryEmbed("__**MODERATION COMMANDS**__", categories.Moderation);
          break;
        case "Setup":
          updatedEmbed = createCategoryEmbed("__**SETUP COMMANDS**__", categories.Setup);
          break;
        case "all":
          updatedEmbed = createAllCommandsEmbed(categories);
          break;
        case "home":
          updatedEmbed = mainEmbed;
          break;
      }

      await i.update({ embeds: [updatedEmbed], components: [dropdownRow, buttonRow] });
    });

    collector.on("end", async () => {
      menu.setDisabled(true);
      await interaction.editReply({ components: [new ActionRowBuilder().addComponents(menu), buttonRow] }).catch(() => null);
    });

    function createCategoryEmbed(title, commands) {
      return new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(title)
        .setDescription(`\`${commands.join("`, `")}\``)
        .setThumbnail(botThumbnail)
        .setFooter({ text: "TRIDENT DEVELOPMENT", iconURL: serverIcon })
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) });
    }

    function createAllCommandsEmbed(categories) {
      return new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle("__**ALL COMMANDS**__")
        .setDescription(`
${music} **__General Commands__**  
\`${categories.General.join("`, `")}\`  

${music} **__ANTINUKE Commands__**  
\`${categories.Antinuke.join("`, `")}\`  

${music} **__MANAGEMENT Commands__**  
\`${categories.Management.join("`, `")}\`  

${music} **__MODERATION Commands__**  
\`${categories.Moderation.join("`, `")}\`  

${music} **__SETUP Commands__**  
\`${categories.Setup.join("`, `")}\`
        `)
        .setThumbnail(botThumbnail)
        .setFooter({ text: "TRIDENT DEVELOPMENT", iconURL: serverIcon })
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) });
    }
  },
};