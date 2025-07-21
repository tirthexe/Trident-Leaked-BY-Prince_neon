const loadCommands = require('./command_handler');
const loadMentionHandler = require('./mention_handler');
const loadDatabase = require('./db_handler');  // Import the new database handler
const loadSlashCommandHandler = require('./slashCommandHandler'); // Import the slash command handler
const loadguildNotificatipnHandler = require('./guildNotificationHandler');//guiild join leave handler
const loadAutoHandler = require('./autohandler');//auto
const loadAntinukeHandler = require('./antinuke_handler'); // Antinuke handler

function loadHandlers(client) {
    loadCommands(client);       // Loads prefix-based commands
    loadMentionHandler(client); // Loads mention-related functionality
    loadDatabase(client);       // Loads database and schemas
    loadSlashCommandHandler(client); // Load slash command handler
    loadguildNotificatipnHandler(client) ;//join leave
    loadAutoHandler(client);//handler 
    loadAntinukeHandler(client);            // Antinuke functionalities
}

module.exports = loadHandlers;