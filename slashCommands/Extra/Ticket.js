const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require('discord.js');
const TicketSetup = require('../../database/TicketSetup');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket system management')
    .addSubcommand(subcommand =>
      subcommand
        .setName('enable')
        .setDescription('Enable a ticket panel')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Disable a ticket panel')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('help')
        .setDescription('Show the help menu for the ticket system')
    ),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('Only **Admins** can use this command.')
            .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })
            .setTimestamp(),
        ],
        ephemeral: true,
      });
    }

    const subCommand = interaction.options.getSubcommand();
    const data = await TicketSetup.findOne({ guildId: interaction.guild.id });

    if (!data || data.panels.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('No panels found. Use `panelcreate` first.')
            .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })
            .setTimestamp(),
        ],
        ephemeral: true,
      });
    }

    // Handle ENABLE
    if (subCommand === 'enable') {
      const panelOptions = data.panels.map((p, index) => ({
        label: p.panelName,
        description: `Panel ${index + 1}`,
        value: `${index}`,
      }));

      const menuRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select_panel_enable')
          .setPlaceholder('Select a panel to enable')
          .addOptions(panelOptions)
      );

      const sent = await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Blue')
            .setTitle('Enable Ticket Panel')
            .setDescription('Select the panel you want to enable.')
            .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })
            .setTimestamp(),
        ],
        components: [menuRow],
        fetchReply: true,
      });

      const collector = sent.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 60000,
        max: 1,
      });

      collector.on('collect', async (interaction) => {
        await interaction.deferUpdate();

        const panelIndex = parseInt(interaction.values[0]);
        const selectedPanel = data.panels[panelIndex];

        const infoEmbed = new EmbedBuilder()
          .setColor('Blue')
          .setTitle(`Panel: ${selectedPanel.panelName}`)
          .addFields(
            { name: 'Button Text', value: selectedPanel.panelButtonName || 'Support', inline: true },
            { name: 'Button Emoji', value: selectedPanel.panelButtonEmoji || '🛠️', inline: true }
          )
          .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        const yesNoRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('yes_enable')
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('no_enable')
            .setLabel('No')
            .setStyle(ButtonStyle.Danger)
        );

        const confirmMsg = await interaction.followUp({
          embeds: [infoEmbed],
          components: [yesNoRow],
        });

        const buttonCollector = confirmMsg.createMessageComponentCollector({
          filter: (i) => i.user.id === interaction.user.id,
          time: 60000,
          max: 1,
        });

        buttonCollector.on('collect', async (btnInt) => {
          await btnInt.deferUpdate();

          if (btnInt.customId === 'yes_enable') {
            selectedPanel.enabled = true;
            await data.save();

            const channel = interaction.guild.channels.cache.get(selectedPanel.ticketChannel);
            if (!channel) return interaction.followUp('Ticket channel not found.');

            // CUSTOM BUTTON ID BASED ON PANEL NUMBER
            const buttonCustomId = `trident_ticket_${panelIndex + 1}`;

            const embed = new EmbedBuilder()
              .setColor('Aqua')
              .setTitle(selectedPanel.panelName || 'Support Panel')
              .setDescription(selectedPanel.panelEmbedMessage || 'Need help? Click below!')
              .setImage(selectedPanel.panelEmbedImage || null)
              .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })
              .setTimestamp();

            const buttonRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(buttonCustomId)
                .setLabel(selectedPanel.panelButtonName || 'Support')
                .setEmoji(selectedPanel.panelButtonEmoji || '🛠️')
                .setStyle(ButtonStyle.Primary)
            );

            const sentMsg = await channel.send({
              content: selectedPanel.panelNormalMessage || 'Need help? Open a ticket!',
              embeds: [embed],
              components: [buttonRow],
            });

            // Save the custom button ID and message ID
            selectedPanel.panelMessageId = sentMsg.id;
            selectedPanel.panelButtonId = buttonCustomId;
            await data.save();

            await confirmMsg.edit({
              embeds: [
                new EmbedBuilder()
                  .setColor('Green')
                  .setDescription('Panel enabled and message sent successfully.')
                  .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })
                  .setTimestamp(),
              ],
              components: [],
            });
          }

          if (btnInt.customId === 'no_enable') {
            await confirmMsg.edit({
              embeds: [
                new EmbedBuilder()
                  .setColor('Red')
                  .setDescription('Operation cancelled.')
                  .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })
                  .setTimestamp(),
              ],
              components: [],
            });
          }
        });
      });
    }

    // Handle DISABLE
    else if (subCommand === 'disable') {
      const panelOptions = data.panels
        .filter((p) => p.enabled)
        .map((p, index) => ({
          label: p.panelName,
          description: `Panel ${index + 1}`,
          value: `${index}`,
        }));

      if (panelOptions.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setDescription('No enabled panels found.')
              .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })
              .setTimestamp(),
          ],
        });
      }

      const menuRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select_panel_disable')
          .setPlaceholder('Select a panel to disable')
          .addOptions(panelOptions)
      );

      const sent = await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Orange')
            .setTitle('Disable Ticket Panel')
            .setDescription('Select the panel you want to disable.')
            .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })
            .setTimestamp(),
        ],
        components: [menuRow],
        fetchReply: true,
      });

      const collector = sent.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 60000,
        max: 1,
      });

      collector.on('collect', async (interaction) => {
        await interaction.deferUpdate();

        const panelIndex = parseInt(interaction.values[0]);
        const selectedPanel = data.panels[panelIndex];

        const yesNoRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('yes_disable')
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('no_disable')
            .setLabel('No')
            .setStyle(ButtonStyle.Danger)
        );

        const confirmMsg = await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setColor('Orange')
              .setTitle(`Panel: ${selectedPanel.panelName}`)
              .setDescription('Do you want to disable this panel?')
              .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })
              .setTimestamp(),
          ],
          components: [yesNoRow],
        });

        const buttonCollector = confirmMsg.createMessageComponentCollector({
          filter: (i) => i.user.id === interaction.user.id,
          time: 60000,
          max: 1,
        });

        buttonCollector.on('collect', async (btnInt) => {
          await btnInt.deferUpdate();

          if (btnInt.customId === 'yes_disable') {
            selectedPanel.enabled = false;
            await data.save();

            await confirmMsg.edit({
              embeds: [
                new EmbedBuilder()
                  .setColor('Green')
                  .setDescription('Panel disabled successfully.')
                  .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })
                  .setTimestamp(),
              ],
              components: [],
            });
          }

          if (btnInt.customId === 'no_disable') {
            await confirmMsg.edit({
              embeds: [
                new EmbedBuilder()
                  .setColor('Red')
                  .setDescription('Operation cancelled.')
                  .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })
                  .setTimestamp(),
              ],
              components: [],
            });
          }
        });
      });
    }

    // Handle HELP
    else if (subCommand === 'help') {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Aqua')
            .setTitle('Ticket Help Menu')
            .setDescription('**ticket enable** → Enable a panel\n**ticket disable** → Disable a panel\n**ticket help** → View this help menu\n\n**TICKET SETUP**\n•|**Panelcreate** – Create A ticket panel for your server\n•|**Panelconfig** - manage a created panel\n•|**panellist** – list of all panels\n•|**paneldelete** – Remove a created panel\n•|**Panelreset** – Reset all ticket setting\n•|**Ticketbutton** – config button of panel\n\n> **CUSTOM MESSAGES FOR PANELS**\n•|**Panelpanelmessage** – config main panel normal/embed message\n•|**Panelopenmessage** – Config open ticket message\n•|**Panelpingmessage** – Config Alert/inactive ping of ticket\n\n> **PANELS COMMANDS**\n•|**close** – Close a ticket\n•|**Delete** – Delete a ticket\n•|**Add** - add user in a ticket channel\n•|**Rename** – rename of ticket channel\n•|**Reopen** – reopen a ticket channel.')
            .setFooter({ text: 'TRIDENT DEVELOPMENT™', iconURL: client.user.displayAvatarURL() })
            .setTimestamp(),
        ],
      });
    }
  },
};