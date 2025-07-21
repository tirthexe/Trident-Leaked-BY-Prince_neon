const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const TicketSetup = require('../database/TicketSetup');

module.exports = (client) => {
client.on('interactionCreate', async (interaction) => {
if (!interaction.isButton()) return;

const data = await TicketSetup.findOne({ guildId: interaction.guildId });  
if (!data) return;  

const panelIndex = data.panels.findIndex(p => p.enabled && p.panelButtonId === interaction.customId);  
if (panelIndex === -1) return;  

const panel = data.panels[panelIndex];  

// Check if user already has a ticket in THIS panel  
const existingTicket = panel.tickets.find(t => t.userId === interaction.user.id && t.status === 'open');  
if (existingTicket) {  
  const existingChannel = interaction.guild.channels.cache.get(existingTicket.channelId);  
  if (existingChannel) {  
    return interaction.reply({ content: `You already have an open ticket: <#${existingTicket.channelId}>`, ephemeral: true });  
  } else {  
    // Remove broken ticket reference  
    data.panels[panelIndex].tickets = panel.tickets.filter(t => t.channelId !== existingTicket.channelId);  
    await data.markModified(`panels.${panelIndex}.tickets`);  
    await data.save();  
  }  
}  

await interaction.deferReply({ ephemeral: true });  

const category = interaction.guild.channels.cache.get(panel.categoryId) || null;  
let ticketCategory = category;  

if (ticketCategory) {  
  const permissions = ticketCategory.permissionsFor(interaction.guild.members.me);  
  if (!permissions.has(PermissionFlagsBits.ManageChannels)) {  
    ticketCategory = null;  
  }  
}  

const ticketChannel = await interaction.guild.channels.create({  
  name: `ticket-${interaction.user.username}`.slice(0, 30),  
  type: ChannelType.GuildText,  
  parent: ticketCategory ? ticketCategory.id : null,  
  permissionOverwrites: [  
    {  
      id: interaction.guild.id,  
      deny: [PermissionFlagsBits.ViewChannel],  
    },  
    {  
      id: interaction.user.id,  
      allow: [  
        PermissionFlagsBits.ViewChannel,  
        PermissionFlagsBits.SendMessages,  
        PermissionFlagsBits.ReadMessageHistory,  
      ],  
    },  
    ...(panel.supportRole  
      ? [{  
          id: panel.supportRole,  
          allow: [  
            PermissionFlagsBits.ViewChannel,  
            PermissionFlagsBits.SendMessages,  
            PermissionFlagsBits.ReadMessageHistory,  
          ],  
        }]  
      : []),  
  ],  
});  

const closeButtonId = `ticket_close_${interaction.user.id}_${Date.now()}`;  

data.panels[panelIndex].tickets.push({  
  userId: interaction.user.id,  
  channelId: ticketChannel.id,  
  status: 'open',  
  closeButtonId: closeButtonId,  
});  
await data.markModified(`panels.${panelIndex}.tickets`);  
await data.save();  

let normalMessage = panel.panelOpenNormalMessage || `Hello <@${interaction.user.id}>, a team member will assist you shortly.`;  
let embedMessage = panel.panelOpenEmbedMessage || `Hello <@${interaction.user.id}> a team member will assist you shortly. Click below to close ticket.`;  

normalMessage = normalMessage.replace(/{user}/g, `<@${interaction.user.id}>`);  
if (embedMessage) {  
  embedMessage = embedMessage.replace(/{user}/g, `<@${interaction.user.id}>`);  
}  

const messagePayload = {};  

if (normalMessage) messagePayload.content = normalMessage;  
if (embedMessage) {  
  const ticketEmbed = new EmbedBuilder()  
    .setColor('Blue')  
    .setDescription(embedMessage)  
    .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })  
    .setTimestamp();  
  messagePayload.embeds = [ticketEmbed];  
}  

if (panel.supportRole) {  
  messagePayload.content = (messagePayload.content || '') + ` <@&${panel.supportRole}>`;  
}  

const closeButton = new ButtonBuilder()  
  .setCustomId(closeButtonId)  
  .setLabel('Close')  
  .setStyle(ButtonStyle.Danger);  

const row = new ActionRowBuilder().addComponents(closeButton);  
messagePayload.components = [row];  

await ticketChannel.send(messagePayload);  

if (panel.logsChannel) {  
  const logsChannel = interaction.guild.channels.cache.get(panel.logsChannel);  
  if (logsChannel) {  
    const logMessage = new EmbedBuilder()  
      .setColor('Green')  
      .setTitle('Ticket Created')  
      .addFields(  
        { name: 'Panel', value: panel.panelName, inline: true },  
        { name: 'Created By', value: `${interaction.user.username} (${interaction.user.id})`, inline: true },  
        { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }  
      )  
      .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })  
      .setTimestamp();  
    await logsChannel.send({ embeds: [logMessage] });  
  }  
}  

await interaction.editReply({ content: `Ticket created: ${ticketChannel}` });

});
};
