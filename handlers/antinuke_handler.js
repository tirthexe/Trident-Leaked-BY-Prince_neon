const fs = require('fs');
const path = require('path');

/**
 * Loads all antinuke-related event files.
 * @param {Client} client - The Discord bot client instance.
 */
function loadAntinukeHandler(client) {
    const antinukePath = path.join(__dirname, '../antinuke');
    const antinukeFiles = fs.readdirSync(antinukePath).filter(file => file.endsWith('.js'));

    for (const file of antinukeFiles) {
        const filePath = path.join(antinukePath, file);
        const antinukeEvent = require(filePath);

        if (antinukeEvent.once) {
            client.once(antinukeEvent.name, (...args) => antinukeEvent.execute(...args, client));
        } else {
            client.on(antinukeEvent.name, (...args) => antinukeEvent.execute(...args, client));
        }

        console.log(`Loaded antinuke event: ${antinukeEvent.name}`);
    }
}

module.exports = loadAntinukeHandler;