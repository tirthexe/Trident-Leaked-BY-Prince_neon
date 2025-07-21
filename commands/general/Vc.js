const { PermissionsBitField } = require("discord.js");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "voice",
  aliases: ["vchelp"],
  description: "Manage users in voice channels (kick, move, pull, mute, unmute).",
  async execute(client, message, args) {
    const subcommand = args[0]?.toLowerCase();
    const target = message.mentions.members.first();
    const targetChannel = message.mentions.channels.first();
    const allMembers =
      subcommand === "kick" || subcommand === "move"
        ? args[1]?.toLowerCase() === "all"
        : null;

    // Check permissions
    if (!message.member.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
      return message.reply({
        embeds: [
          createEmbed(
            "#FF0000",
            `${emoji.error} You don't have permission to manage voice channels.`,
            message.author,
            client,
            null
          ),
        ],
      });
    }

    // Subcommands handling
    switch (subcommand) {
      case "kick":
        if (allMembers) {
          const channel = message.member.voice.channel;
          if (!channel)
            return message.reply({
              embeds: [
                createEmbed(
                  "#FF0000",
                  `${emoji.error} You must be in a voice channel to kick all members.`,
                  message.author,
                  client,
                  null
                ),
              ],
            });

          channel.members.forEach((member) => member.voice.disconnect());
          return message.reply({
            embeds: [
              createEmbed(
                "#00FF00",
                `${emoji.tick} Kicked all members from the voice channel.`,
                message.author,
                client,
                null
              ),
            ],
          });
        }

        if (!target || !target.voice.channel) {
          return message.reply({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} Please mention a user in a voice channel to kick.`,
                message.author,
                client,
                null
              ),
            ],
          });
        }

        await target.voice.disconnect();
        return message.reply({
          embeds: [
            createEmbed(
              "#00FF00",
              `${emoji.tick} Successfully kicked ${target.user.tag} from the voice channel.`,
              message.author,
              client,
              null
            ),
          ],
        });

      case "move":
        if (allMembers) {
          const currentChannel = message.member.voice.channel;
          if (!currentChannel || !targetChannel) {
            return message.reply({
              embeds: [
                createEmbed(
                  "#FF0000",
                  `${emoji.error} Please specify both a source and a destination voice channel.`,
                  message.author,
                  client,
                  null
                ),
              ],
            });
          }

          currentChannel.members.forEach((member) =>
            member.voice.setChannel(targetChannel)
          );
          return message.reply({
            embeds: [
              createEmbed(
                "#00FF00",
                `${emoji.tick} Moved all members to ${targetChannel.name}.`,
                message.author,
                client,
                null
              ),
            ],
          });
        }

        if (!target || !target.voice.channel || !targetChannel) {
          return message.reply({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.tick} Please mention a user and a destination voice channel.`,
                message.author,
                client,
                null
              ),
            ],
          });
        }

        await target.voice.setChannel(targetChannel);
        return message.reply({
          embeds: [
            createEmbed(
              "#00FF00",
              `${emoji.tick} Successfully moved ${target.user.tag} to ${targetChannel.name}.`,
              message.author,
              client,
              null
            ),
          ],
        });

      case "pull":
        if (!target || !target.voice.channel) {
          return message.reply({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} Please mention a user in a voice channel to pull.`,
                message.author,
                client,
                null
              ),
            ],
          });
        }

        const userChannel = message.member.voice.channel;
        if (!userChannel) {
          return message.reply({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} You must be in a voice channel to pull a user.`,
                message.author,
                client,
                null
              ),
            ],
          });
        }

        await target.voice.setChannel(userChannel);
        return message.reply({
          embeds: [
            createEmbed(
              "#00FF00",
              `${emoji.tick} Successfully pulled ${target.user.tag} to your voice channel.`,
              message.author,
              client,
              null
            ),
          ],
        });

      case "mute":
        if (!target || !target.voice.channel) {
          return message.reply({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} Please mention a user in a voice channel to mute.`,
                message.author,
                client,
                null
              ),
            ],
          });
        }

        await target.voice.setMute(true);
        return message.reply({
          embeds: [
            createEmbed(
              "#00FF00",
              `${emoji.tick} Successfully muted ${target.user.tag} in the voice channel.`,
              message.author,
              client,
              null
            ),
          ],
        });

      case "unmute":
        if (!target || !target.voice.channel) {
          return message.reply({
            embeds: [
              createEmbed(
                "#FF0000",
                `${emoji.error} Please mention a user in a voice channel to unmute.`,
                message.author,
                client,
                null
              ),
            ],
          });
        }

        await target.voice.setMute(false);
        return message.reply({
          embeds: [
            createEmbed(
              "#00FF00",
              `${emoji.tick} Successfully unmuted ${target.user.tag} in the voice channel.`,
              message.author,
              client,
              null
            ),
          ],
        });

      default:
        return message.reply({
          embeds: [
            createEmbed(
              "#FFFFFF",
              `\`\`\`diff
- [] = optional argument
- <> = required argument
- Do NOT type these when using commands!
\`\`\`

Voice Channel Management
**Aliases**
> vc

**Usage**
> vc kick all/<user>
> vc move all/<user> <channel>
> vc pull <user>
> vc mute <user>
> vc unmute <user>`,
              message.author,
              client,
              null
            ),
          ],
        });
    }
  },
};