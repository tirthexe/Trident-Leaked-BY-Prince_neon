const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, EmbedBuilder } = require('discord.js');
const TicketSetup = require('../../database/TicketSetup');

module.exports = {
  name: 'panelcreate',
  aliases: ['ticketcreate', 'ticketsetup'],
  description: 'Start ticket panel setup.',
  async execute(client, message) {
    const executor = message.author;
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('You must be an admin to use this command.')] });
    }

    let ticketData = await TicketSetup.findOne({ guildId: message.guild.id });
    if (!ticketData) ticketData = new TicketSetup({ guildId: message.guild.id, panels: [] });

    let panelName = "";
    let categoryId = null;
    let ticketChannel = null;
    let supportRole = null;
    let logsChannel = null;

    const confirmation = await message.reply({
      embeds: [new EmbedBuilder().setColor('Aqua').setTitle("Create Ticket Panel").setDescription("Do you want to start creating a new ticket panel?")],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_yes').setLabel('Yes').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('ticket_no').setLabel('No').setStyle(ButtonStyle.Danger),
      )],
    });

    const filter = (i) => i.user.id === executor.id;
    const collector = confirmation.createMessageComponentCollector({ filter, time: 60000, max: 1 });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'ticket_no') {
        return interaction.update({ embeds: [new EmbedBuilder().setColor('Red').setDescription('Ticket panel creation cancelled.')], components: [] });
      }

      await interaction.update({ embeds: [new EmbedBuilder().setColor('Aqua').setDescription('Enter your **Panel Name** below.')], components: [] });

      const panelNameCollector = message.channel.createMessageCollector({ filter: m => m.author.id === executor.id, max: 1, time: 60000 });
      panelNameCollector.on('collect', async (msg1) => {
        panelName = msg1.content;

        const msgEdit1 = await message.channel.send({
          embeds: [new EmbedBuilder().setColor('Aqua').setDescription(`Panel Name set to **${panelName}**.\nClick below to set Ticket Category.`)],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_category').setLabel('Set Category').setStyle(ButtonStyle.Primary),
          )],
        });

        const categoryCollector = msgEdit1.createMessageComponentCollector({ filter, max: 1, time: 60000 });
        categoryCollector.on('collect', async (i2) => {
          await i2.update({ embeds: [new EmbedBuilder().setColor('Aqua').setDescription('Mention or provide the **Category ID** for ticket creation. Type `skip` to skip.')], components: [] });

          const categoryInput = message.channel.createMessageCollector({ filter: m => m.author.id === executor.id, max: 1, time: 60000 });
          categoryInput.on('collect', async (msg2) => {
            if (msg2.content.toLowerCase() !== 'skip') {
              const category = msg2.content.replace(/<|#|>/g, '');
              const categoryChannel = message.guild.channels.cache.get(category);
              if (!categoryChannel || categoryChannel.type !== 4) {
                return message.channel.send({ embeds: [new EmbedBuilder().setColor('Red').setDescription('Invalid category ID.')] });
              }
              categoryId = category;
            }

            const msgEdit2 = await message.channel.send({
              embeds: [new EmbedBuilder().setColor('Aqua').setDescription(`Category ${categoryId ? `set to <#${categoryId}>` : 'skipped'}.\nClick below to set Ticket Channel.`)],
              components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ticket_channel').setLabel('Set Ticket Channel').setStyle(ButtonStyle.Primary),
              )],
            });

            const ticketChannelCollector = msgEdit2.createMessageComponentCollector({ filter, max: 1, time: 60000 });
            ticketChannelCollector.on('collect', async (i3) => {
              await i3.update({ embeds: [new EmbedBuilder().setColor('Aqua').setDescription('Mention or provide the **Channel ID** for ticket panel message.')], components: [] });

              const channelInput = message.channel.createMessageCollector({ filter: m => m.author.id === executor.id, max: 1, time: 60000 });
              channelInput.on('collect', async (msg3) => {
                const ticketChannelRaw = msg3.content.replace(/<|#|>/g, '');
                const channelObj = message.guild.channels.cache.get(ticketChannelRaw);
                if (!channelObj) return message.channel.send({ embeds: [new EmbedBuilder().setColor('Red').setDescription('Invalid channel ID.')] });

                ticketChannel = ticketChannelRaw;

                const msgEdit3 = await message.channel.send({
                  embeds: [new EmbedBuilder().setColor('Aqua').setDescription(`Ticket channel set to <#${ticketChannel}>.\nClick below to set Supporter Role.`)],
                  components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ticket_role').setLabel('Set Supporter Role').setStyle(ButtonStyle.Primary),
                  )],
                });

                const roleCollector = msgEdit3.createMessageComponentCollector({ filter, max: 1, time: 60000 });
                roleCollector.on('collect', async (i4) => {
                  await i4.update({ embeds: [new EmbedBuilder().setColor('Aqua').setDescription('Mention or provide the **Supporter Role ID**. Type `skip` to skip.')], components: [] });

                  const roleInput = message.channel.createMessageCollector({ filter: m => m.author.id === executor.id, max: 1, time: 60000 });
                  roleInput.on('collect', async (msg4) => {
                    if (msg4.content.toLowerCase() !== 'skip') {
                      const role = msg4.mentions.roles.first() || message.guild.roles.cache.get(msg4.content);
                      if (!role) return message.channel.send({ embeds: [new EmbedBuilder().setColor('Red').setDescription('Invalid role ID.')] });
                      supportRole = role.id;
                    }

                    const msgEdit4 = await message.channel.send({
                      embeds: [new EmbedBuilder().setColor('Aqua').setDescription(`Support Role set to <@&${supportRole}>.\nClick below to set Logs Channel.`)],
                      components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('ticket_logs').setLabel('Set Logs Channel').setStyle(ButtonStyle.Primary),
                      )],
                    });

                    const logsChannelCollector = msgEdit4.createMessageComponentCollector({ filter, max: 1, time: 60000 });
                    logsChannelCollector.on('collect', async (i5) => {
                      await i5.update({ embeds: [new EmbedBuilder().setColor('Aqua').setDescription('Mention or provide the **Logs Channel ID**. Type `skip` to skip.')], components: [] });

                      const logsInput = message.channel.createMessageCollector({ filter: m => m.author.id === executor.id, max: 1, time: 60000 });
                      logsInput.on('collect', async (msg5) => {
                        if (msg5.content.toLowerCase() !== 'skip') {
                          const logChannelRaw = msg5.content.replace(/<|#|>/g, '');
                          const logChannelObj = message.guild.channels.cache.get(logChannelRaw);
                          if (!logChannelObj) return message.channel.send({ embeds: [new EmbedBuilder().setColor('Red').setDescription('Invalid channel ID.')] });

                          logsChannel = logChannelRaw;
                        }

                        // Save to DB
                        ticketData.panels.push({
                          panelName,
                          categoryId,
                          ticketChannel,
                          supportRole,
                          logsChannel
                        });

                        await ticketData.save();

                        return message.channel.send({
                          embeds: [new EmbedBuilder().setColor('Green').setDescription(`**Ticket Panel Created Successfully!**\n\n**Panel:** ${panelName}\n**Category:** ${categoryId ? `<#${categoryId}>` : 'Skipped'}\n**Channel:** <#${ticketChannel}>\n**Support Role:** ${supportRole ? `<@&${supportRole}>` : 'skipped'}\n**Logs Channel:** ${logsChannel ? `<#${logsChannel}>` : 'Skipped'}`)],
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }
};