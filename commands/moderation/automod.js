const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AutoModerationRuleTriggerType,
  StringSelectMenuBuilder, } = require('discord.js');
const { createEmbed } = require('../../embed');
const emoji = require('../../emoji');
const bannedWords = require('../../bannedWords');
const Automod = require('../../database/Automod');

module.exports = {
  name: 'automod',
  description: 'Set up AutoMod rules for your server.',
  async execute(client, message, args) {
    const executor = message.author;

    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply({
        embeds: [
          createEmbed(
            '#FF0000',
            `${emoji.error} | You don't have permission to manage AutoMod.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    if (!message.guild.members.me.permissions.has('ManageGuild')) {
      return message.reply({
        embeds: [
          createEmbed(
            '#FF0000',
            `${emoji.error} | I don't have permission to manage AutoMod.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    const sub = args[0]?.toLowerCase();

// === WHITELIST SUBCOMMAND ===
if (args[0]?.toLowerCase() === 'whitelist') {
  const targetArg = args[1];
  if (!targetArg) {
    return message.reply(`${emoji.error} | Please provide a user, role, channel, or category ID/mention.`);
  }

  let type, targetId, displayName;

  const user = message.mentions.users.first() || await client.users.fetch(targetArg).catch(() => null);
  const role = message.mentions.roles.first() || message.guild.roles.cache.get(targetArg);
  const channel = message.mentions.channels.first() || message.guild.channels.cache.get(targetArg);
  const category = message.guild.channels.cache.find(ch => ch.type === 4 && ch.id === targetArg);

  if (user) {
    type = 'users';
    targetId = user.id;
    displayName = `<@${user.id}>`;
  } else if (role) {
    type = 'roles';
    targetId = role.id;
    displayName = `<@&${role.id}>`;
  } else if (channel && channel.type !== 4) {
    type = 'channels';
    targetId = channel.id;
    displayName = `<#${channel.id}>`;
  } else if (category) {
    type = 'categories';
    targetId = category.id;
    displayName = category.name;
  } else {
    return message.reply(`${emoji.error} | Invalid target. Provide a valid user/role/channel/category mention or ID.`);
  }

  let data = await Automod.findOne({ guildId: message.guild.id });
  if (!data) {
    data = await Automod.create({ guildId: message.guild.id });
  }

  const isWhitelisted = {
    antispam: data.whitelist.antispam[type].includes(targetId),
    antimention: data.whitelist.antimention[type].includes(targetId),
    antilink: data.whitelist.antilink[type].includes(targetId),
    antiad: data.whitelist.antiad[type].includes(targetId),
  };

  const embed = new EmbedBuilder()
    .setColor('#2F3136')
    .setTitle(`Current AutoMod Whitelist Status for ${displayName}`)
    .setDescription(`
> ${isWhitelisted.antispam ? emoji.on : emoji.off} Antispam  
> ${isWhitelisted.antimention ? emoji.on : emoji.off} Antimention  
> ${isWhitelisted.antilink ? emoji.on : emoji.off} Antilink  
> ${isWhitelisted.antiad ? emoji.on : emoji.off} Antiadvertise
    `)
    .setFooter({ text: `Select rules from the dropdown to toggle whitelist for this target.` });

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`automod_whitelist_${type}_${targetId}`)
      .setPlaceholder('Select rules to whitelist/unwhitelist...')
      .setMinValues(1)
      .setMaxValues(4)
      .addOptions([
        { label: 'Antispam', value: 'antispam' },
        { label: 'Antimention', value: 'antimention' },
        { label: 'Antilink', value: 'antilink' },
        { label: 'Antiadvertise', value: 'antiad' },
      ])
  );

  const sentMessage = await message.reply({ embeds: [embed], components: [row] });

  const filter = i => i.customId === `automod_whitelist_${type}_${targetId}` && i.user.id === message.author.id;
  const collector = sentMessage.createMessageComponentCollector({ filter, time: 60_000, max: 1 });

  collector.on('collect', async interaction => {
    await interaction.deferUpdate();

    const selectedRules = interaction.values;

    for (const rule of selectedRules) {
      const arr = data.whitelist[rule][type];

      if (arr.includes(targetId)) {
        data.whitelist[rule][type] = arr.filter(id => id !== targetId);
      } else {
        arr.push(targetId);
        data.whitelist[rule][type] = arr;
      }
    }

    await data.save();

    const updatedStatus = {
      antispam: data.whitelist.antispam[type].includes(targetId),
      antimention: data.whitelist.antimention[type].includes(targetId),
      antilink: data.whitelist.antilink[type].includes(targetId),
      antiad: data.whitelist.antiad[type].includes(targetId),
    };

    const updatedEmbed = new EmbedBuilder()
      .setColor('#2F3136')
      .setTitle(`Updated AutoMod Whitelist Status for ${displayName}`)
      .setDescription(`
> ${updatedStatus.antispam ? emoji.on : emoji.off} Antispam  
> ${updatedStatus.antimention ? emoji.on : emoji.off} Antimention  
> ${updatedStatus.antilink ? emoji.on : emoji.off} Antilink  
> ${updatedStatus.antiad ? emoji.on : emoji.off} Antiadvertise
      `)
      .setFooter({ text: `Whitelist updated. Interaction disabled.` });

    const disabledRow = new ActionRowBuilder().addComponents(
      row.components[0].setDisabled(true)
    );

    await interaction.editReply({ embeds: [updatedEmbed], components: [disabledRow] });
  });

  collector.on('end', collected => {
    if (collected.size === 0) {
      const disabledRow = new ActionRowBuilder().addComponents(
        row.components[0].setDisabled(true)
      );
      sentMessage.edit({ components: [disabledRow] }).catch(() => {});
    }
  });
}

  //==LOG======    
 if (args[0]?.toLowerCase() === 'log') {
  const sub = args[1]?.toLowerCase();

  let data = await Automod.findOne({ guildId: message.guild.id });
  if (!data) data = await Automod.create({ guildId: message.guild.id });

  if (sub === 'set') {
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]);
    if (!channel) return message.reply(`${emoji.error} | Please mention a valid channel or provide a channel ID.`);

    data.logChannel = channel.id;
    await data.save();

    return message.reply(`${emoji.success} | AutoMod logs will now be sent to ${channel}.`);
  }

  if (sub === 'reset') {
    data.logChannel = null;
    await data.save();

    return message.reply(`${emoji.success} | AutoMod log channel has been reset.`);
  }

  if (sub === 'show') {
    const logChannel = data.logChannel ? `<#${data.logChannel}>` : 'Not Set';
    return message.reply(`${emoji.info} | Current AutoMod log channel: ${logChannel}`);
  }

  return message.reply(`${emoji.error} | Invalid option. Use \`log set <channel>\`, \`log reset\`, or \`log show\`.`);
 }
      
// === WHITELISTED SUBCOMMAND ===
if (args[0]?.toLowerCase() === 'whitelisted') {
  const data = await Automod.findOne({ guildId: message.guild.id });
  if (!data) {
    return message.reply(`${emoji.error} | No AutoMod data found.`);
  }

  const types = ['antispam', 'antilink', 'antiad', 'antimention'];
  const embeds = [];

  for (const type of types) {
    const list = data.whitelist?.[type];
    if (!list) continue;

    const userMentions = list.users.length
      ? list.users.map((id, i) => `> [${i + 1}] <@${id}>`).join('\n')
      : '> No users whitelisted';

    const channelMentions = list.channels.length
      ? list.channels.map((id, i) => `> [${i + 1}] <#${id}>`).join('\n')
      : '> No channels whitelisted';

    const categoryMentions = list.categories.length
      ? list.categories.map((id, i) => {
          const cat = message.guild.channels.cache.get(id);
          return cat && cat.type === 4
            ? `> [${i + 1}] ${cat.name} (${cat.id})`
            : `> [${i + 1}] Unknown (${id})`;
        }).join('\n')
      : '> No categories whitelisted';

    const roleMentions = list.roles.length
      ? list.roles.map((id, i) => `> [${i + 1}] <@&${id}>`).join('\n')
      : '> No roles whitelisted';

    const embed = new EmbedBuilder()
      .setColor('#2F3136')
      .setTitle(`AUTOMOD WHITELIST — ${type.toUpperCase()}`)
      .addFields(
        { name: '__USERS__', value: userMentions },
        { name: '__CHANNELS__', value: channelMentions },
        { name: '__CATEGORIES__', value: categoryMentions },
        { name: '__ROLES__', value: roleMentions }
      );

    embeds.push(embed);
  }

  if (!embeds.length) {
    return message.reply(`${emoji.error} | No whitelist data found.`);
  }

  return message.reply({ embeds });
}
      
// == ENABLE ==
    if (sub === 'enable') {
      try {
        const existingRules = await message.guild.autoModerationRules.fetch();
        const tridentRules = existingRules.filter((rule) =>
          rule.name.startsWith('Trident Rule')
        );
        if (tridentRules.size === 0) {
          // Delete old rules except mention spam
          for (const rule of existingRules.values()) {
            if (rule.triggerType !== AutoModerationRuleTriggerType.MentionSpam) {
              await rule.delete(`Reset by ${executor.tag}`);
            }
          }

          await message.guild.autoModerationRules.create({
            name: 'Trident Rule 1',
            eventType: 1,
            triggerType: AutoModerationRuleTriggerType.Keyword,
            triggerMetadata: {
              keywordFilter: bannedWords,
            },
            actions: [{ type: 1 }],
            enabled: true,
            reason: `AutoMod setup by ${executor.tag}`,
          });

          const mentionSpamRule = existingRules.find(
            (rule) => rule.triggerType === AutoModerationRuleTriggerType.MentionSpam
          );

          if (!mentionSpamRule) {
            await message.guild.autoModerationRules.create({
              name: 'Trident Rule 2',
              eventType: 1,
              triggerType: AutoModerationRuleTriggerType.MentionSpam,
              triggerMetadata: {
                mentionTotalLimit: 5,
              },
              actions: [{ type: 1 }],
              enabled: true,
              reason: `AutoMod setup by ${executor.tag}`,
            });
          }

          await message.guild.autoModerationRules.create({
            name: 'Trident Rule 3',
            eventType: 1,
            triggerType: AutoModerationRuleTriggerType.KeywordPreset,
            triggerMetadata: {
              presets: [1],
            },
            actions: [{ type: 1 }],
            enabled: true,
            reason: `AutoMod setup by ${executor.tag}`,
          });
        }

        await Automod.findOneAndUpdate(
          { guildId: message.guild.id },
          { enabled: true },
          { upsert: true, new: true }
        );

        return message.reply({
          embeds: [
            createEmbed(
              '#00FF00',
              `${emoji.tick} | AutoMod has been **enabled** and the following rules are active:\n\n` +
                `1. **Trident Rule 1**: Blocks offensive language.\n` +
                `2. **Trident Rule 2**: Limits excessive mentions.\n` +
                `3. **Trident Rule 3**: Blocks Discord invites.`,
              executor,
              client,
              null
            ),
          ],
        });
      } catch (error) {
        console.error('Error enabling AutoMod:', error);
        return message.reply({
          embeds: [
            createEmbed(
              '#FF0000',
              `${emoji.error} | Failed to enable AutoMod. Please check my permissions and rule limits.`,
              executor,
              client,
              null
            ),
          ],
        });
      }
    }
      
      // ====== PUNISHMENT= = ==== 
  if (args[0]?.toLowerCase() === 'punishment') {
  const sub = args[1]?.toLowerCase();

  let data = await Automod.findOne({ guildId: message.guild.id });
  if (!data) data = await Automod.create({ guildId: message.guild.id });

  if (sub === 'set') {
    const type = args[2]?.toLowerCase();
    const validTypes = ['kick', 'ban', 'warn', 'mute'];
    if (!type || !validTypes.includes(type)) {
      return message.reply(`${emoji.error} | Please provide a valid punishment type: \`kick\`, \`ban\`, \`warn\`, \`mute\`.`);
    }

    if (type === 'mute') {
      const duration = args[3];
      if (!duration || !/^\d+[smhd]$/.test(duration)) {
        return message.reply(`${emoji.error} | Please provide a valid mute duration (e.g., \`10m\`, \`2h\`, \`1d\`).`);
      }

      data.punishment = 'mute';
      data.muteDuration = duration;
      await data.save();
      return message.reply(`${emoji.success} | Punishment set to \`mute\` with duration \`${duration}\`.`);
    }

    data.punishment = type;
    await data.save();
    return message.reply(`${emoji.success} | Punishment set to \`${type}\`.`);
  }

  if (sub === 'show') {
    const currentPunishment = data.punishment || 'Not Set';
    const durationInfo = data.punishment === 'mute' ? ` (\`${data.muteDuration}\`)` : '';
    return message.reply(`${emoji.info} | Current AutoMod punishment: \`${currentPunishment}\`${durationInfo}`);
  }

  if (sub === 'reset') {
    data.punishment = 'mute';
    data.muteDuration = '2m';
    await data.save();
    return message.reply(`${emoji.success} | Punishment has been reset to default: \`mute\` (\`2m\`).`);
  }

  return message.reply(`${emoji.error} | Invalid option. Use \`punishment set <type> [duration]\`, \`punishment show\`, or \`punishment reset\`.`);
  }
      
 //== HELP ====
if (args[0]?.toLowerCase() === 'help') {
  const embed = new EmbedBuilder()
    .setColor('#ffff3f')
    .setTitle('AutoMod Help Menu')
    .setDescription(`
> [1] **Automod Enable** – Enables the AutoMod system.  

> [2] **Automod Disable** – Disables the AutoMod system.  

> [3] **Automod Punishment <mute/warn/ban/kick> <duration>** – Sets the punishment and optional mute duration for violations.  

> [4] **Automod Log set <#channel or ID>** – Sets the log channel for AutoMod events.  

> [5] **Automod Log reset** – Resets the current log channel.  

> [6] **Automod Log show** – Displays the currently configured log channel.  

> [7] **Automod Whitelist <user/role/channel/category || ID/mention>** – Bypass AutoMod checks for a user, role, channel, or category.  

> [8] **Automod Whitelisted** – Shows a list of all whitelisted users, roles, channels, and categories.
    `)
    .setFooter({ text: 'TRIDENT ❤️ DEVELOPMENT', iconURL: client.user.displayAvatarURL() });

  return message.reply({ embeds: [embed] });
}
      
      
// == DISABLE ==
if (sub === 'disable') {
  try {
    const existingConfig = await Automod.findOne({ guildId: message.guild.id });

    if (!existingConfig) {
      return message.reply({
        embeds: [
          createEmbed(
            '#FF0000',
            `${emoji.error} | AutoMod is not enabled for this server.`,
            executor,
            client,
            null
          ),
        ],
      });
    }

    await Automod.findOneAndDelete({ guildId: message.guild.id });

    return message.reply({
      embeds: [
        createEmbed(
          '#FF0000',
          `${emoji.error} | AutoMod has been **disabled** and all data has been **removed**.`,
          executor,
          client,
          null
        ),
      ],
    });
  } catch (error) {
    console.error('Error disabling AutoMod:', error);
    return message.reply({
      embeds: [
        createEmbed(
          '#FF0000',
          `${emoji.error} | Failed to disable and remove AutoMod data.`,
          executor,
          client,
          null
        ),
      ],
    });
  }
}

    // No response if no subcommand or unknown one (for future support)
  },
};