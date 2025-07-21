const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');
const emoji = require('../../emoji');
const prefixDB = require('../../database/prefix');

module.exports = {
  name: 'help',
  description: 'Show help command',
  async execute(client, message, args) {
    const prefixData = await prefixDB.findOne({ guildId: message.guild.id });
    const prefix = prefixData ? prefixData.prefix : '$';

    const categories = {
      antinuke: `** __ ANTINUKE COMMANDS__ \n\`\`\`Antinuke enable , antinuke disable , Antinukelog set , Antinukelog reset , Antinukelog show , Whitelist, Whitelisted , uwhitelist, extraowner set , extraowner reset , extraowner list , extraowner remove \`\`\` .
      __ EXTRA MODULE __
\n\`\`\`Quarantinerole create , quarantinerole set , quarantinerole reset , quarantinerole show , Quarantinelog create, quarantinelog set , quarantinelog reset , quarantinelog show , Quarantine @user/id , uquarantine @user/id \`\`\` **.`,
      automod: `**__AUTOMOD__\n\`\`\`Automod enable , Automod Disable , Automod punishment, Automod log set , automod log reset , automod log show , automod Whitelisted [user/channel/category/role ] , automod whitelisted \`\`\`**`,
      ticket: `** __ TICKET CONFIG __ \n\`\`\` Ticket enable , Ticket disable , ticket help, panelcreate , panelconfig, panellist, paneldelete, panelreset , panelbutton, Panelpanelmessage, Panelopenmessage, Panelpingmessage, Ticketlist \`\`\`
__ TICKET CHANNEL COMMANDS __
\`\`\` Close , delete , add [user] , rename, reopen \`\`\`
__ AUTO THREAD  [at] __
\`\`\` at channel show , at channel add , at channel remove , at role show , at role remove , at role add , at enable , at disable, at help \`\`\`**`,
      autoreact: `**__ AUTO RESPOND (ATT) __ \n\`\`\` Att add <trigger> <reply> , att remove <trigger> , att reset , att edit <trigger> <new reply> ,att list , att autodel<1-1000> \`\`\` **
 ** __ AUTO REACT __ \n\`\`\` Autoreact add <trigger> <emoji> , Autoreact remove <trigger> , Autoreact list \`\`\` **`,
      giveaway: `** __GIVEAWAY COMMANDS __ \n\`\`\`GIveawaystart , Giveawayend , Giveawayreroll , Giveawayimage , \`\`\`
__ SLOT COMMANDS __
\`\`\`slotinfo , Slotping add, Slotping remove , Slot category, Slot role add , slot role remove , slot revoke , slotuser  \`\`\`**`,
      utility: `** __UTILITY COMMANDS __ \n\`\`\`avatar, afk , banner, list, list roles , lustinrole, list bots, list admins, list bans,  membercount [mc] , serverinfo , roleinfo , steal , Stealall , timer , userinfo, roleinfo, roleicon, purge, role, roleall, snipe, Prefix \`\`\`,
 __ MODRATION COMMANDS __ \n\`\`\`Kick, ban,hide,unhide,hideall, unhideall, lock , lockall , unlock , unlockall , mute , unmute , unmuteall , nick , nuke , purge , Roleall , role , unban , warn  \`\`\`**`,
      voice: `** __ JOIN TO CREATE  __ \n\`\`\`Autovoice enable , autovoice disable , autovoice show , autovoice reset , autovoice help , Autovoicecreate , autovoiceconfig , autovoicemessage \`\`\`
__ Voice role  __
\`\`\`Vcrole set @role/id , vcrole remove @role/I'd, vcrole show \`\`\`
__ Voice command __
\`\`\`vc move , vc kick , vc mute , vc unmute , vc pull , vc muteall , vc moveall , vc kickall , vc help \`\`\`**`,
      joingate: `** __ JOIN GATE __ \n\`\`\`Autorole add , Autorole remove , Autorole list \`\`\`**`,
      customroles: `** __ CUSTOM ROLES __ \n\`\`\` setup add , setup remove , setup set manager , setup list , setup help \`\`\`,
   __ MEDIA ONLY CHANNEL __ \n\`\`\` Media add , media info, media remove , media bypass add , media bypass remove , media bypass list, media help \`\`\`**`,
      botinfo: `** __ BOT INFORMATION COMMANDS __ \n\`\`\` Ping, uptime , support, badge, setbio , premium, report, stats , invite, commandinfo ,  Updates , changelog , broadcast , Commands \`\`\`**`,
    };

    const homeEmbed = new EmbedBuilder()
      .setColor('Yellow')
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL()
      })
      .setDescription(`**Hey,<@${message.author.id}> I’m Trident ! a powerful security and moderation bot built for ultimate server protection.Experience a fully customizable system tailored for your needs.

•> My Prefix For This Server : ${prefix}
•> Total Commands : 224
[Support](https://discord.gg/lovers-arenaa) | [Invite](https://idk) **

<:TRFOLDER:1370243618371272867> COMMANDS & MODULES

> ${emoji.antinuke}  ANTINUKE
> ${emoji.automod} AUTOMOD
> ${emoji.ticket} TICKET & THREAD
> ${emoji.autoreact} REACT & RESPONDER
> ${emoji.giveaway} GIVEAWAY & SLOTS
> ${emoji.customroles} CUSTOM ROLES & MEDIA
> ${emoji.voice} VOICE CREATOR 
> ${emoji.joingate} JOIN GATE
> ${emoji.utility} MODERATION & Other
> ${emoji.botinfo} BOT INFO

\`\`Secure, smart, and made to simplify your Discord management! \`\` `)
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: `TRIDENT ❤️ DEVELOPEMENT `, iconURL: client.user.displayAvatarURL() });

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('home_embed').setLabel('Home').setStyle(ButtonStyle.Primary)
    );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_select')
      .setPlaceholder('Select a category')
      .addOptions(
        Object.keys(categories).map(key => ({
          label: key.replace(/_/g, ' ').toUpperCase(),
          value: key,
          emoji: emoji[key] || undefined
        }))
      );

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    const helpMessage = await message.channel.send({
      embeds: [homeEmbed],
      components: [buttonRow, selectRow]
    });

    const collector = helpMessage.createMessageComponentCollector({
      time: 5 * 60 * 1000,
      filter: i => {
        if (i.user.id !== message.author.id) {
          i.reply({ content: "You can't control this system.", ephemeral: true });
          return false;
        }
        return true;
      }
    });

    collector.on('collect', async interaction => {
      if (interaction.isButton()) {
        if (interaction.customId === 'home_embed') {
          await interaction.update({ embeds: [homeEmbed], components: [buttonRow, selectRow] });
        }
      } else if (interaction.isStringSelectMenu()) {
        const selected = interaction.values[0];
        const embed = new EmbedBuilder()
          .setColor('Yellow')
          .setDescription(categories[selected])
          .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

        await interaction.update({ embeds: [embed], components: [buttonRow, selectRow] });
      }
    });

    collector.on('end', async () => {
      const disabledButtonRow = new ActionRowBuilder().addComponents(
        buttonRow.components.map(button => ButtonBuilder.from(button).setDisabled(true))
      );

      const disabledSelectRow = new ActionRowBuilder().addComponents(
        StringSelectMenuBuilder.from(selectMenu).setDisabled(true)
      );

      await helpMessage.edit({
        components: [disabledButtonRow, disabledSelectRow]
      });
    });
  }
};