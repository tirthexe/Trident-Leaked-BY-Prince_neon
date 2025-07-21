const { REST, Routes } = require("discord.js");
const { readdirSync } = require("fs");
const path = require("path");

const BOT_TOKEN = "MTM2NDMzMTM3NTIxMzE1NDQwNg.GZzrN4.hMAFpWb2RozavtpPUz387_Diy2HOuVXt3yJSlY"; // Replace with your actual bot token

function loadSlashCommands(client) {
  client.slashCommands = new Map();
  const commandFolders = readdirSync(path.join(__dirname, "../slashCommands"));

  for (const folder of commandFolders) {
    const commandFiles = readdirSync(path.join(__dirname, `../slashCommands/${folder}`)).filter((file) =>
      file.endsWith(".js")
    );

    for (const file of commandFiles) {
      const command = require(path.join(__dirname, `../slashCommands/${folder}/${file}`));
      if (command.data && command.execute) {
        client.slashCommands.set(command.data.name, command); // `data.name` for slash command
        console.log(`Loaded slash command: ${command.data.name}`);
      } else {
        console.warn(`Skipping invalid slash command file: ${file}`);
      }
    }
  }

  console.log("Slash commands loaded successfully!");
}

async function registerSlashCommands(client) {
  const slashCommandsArray = [];
  client.slashCommands.forEach((command) => {
    slashCommandsArray.push(command.data.toJSON()); // Convert SlashCommandBuilder to JSON
  });

  const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
  try {
    console.log("Registering global slash commands...");
    await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommandsArray });
    console.log("Successfully registered slash commands!");
  } catch (error) {
    console.error("Failed to register slash commands:", error);
  }
}

function handleSlashInteractions(client) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) {
      return interaction.reply({ content: "This command does not exist!", ephemeral: true });
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`Error executing slash command "${interaction.commandName}":`, error);
      interaction.reply({
        content: "There was an error while executing this command.",
        ephemeral: true,
      });
    }
  });

  console.log("Slash command interaction handler loaded!");
}

module.exports = async function (client) {
  loadSlashCommands(client);
  await registerSlashCommands(client);
  handleSlashInteractions(client);
};