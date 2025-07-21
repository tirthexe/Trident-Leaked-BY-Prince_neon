const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  const autoHandlerPath = path.join(__dirname, '../autohandler');
  const handlerFiles = fs.readdirSync(autoHandlerPath).filter(file => file.endsWith('.js'));

  if (handlerFiles.length === 0) {
    console.log("❌ No auto-handlers found. Place handler files in the 'autohandler' folder.");
    return;
  }

  for (const file of handlerFiles) {
    const handler = require(path.join(autoHandlerPath, file));

    if (typeof handler === 'function') {
      try {
        handler(client); // Pass the client to each handler
        console.log(`✅ Successfully loaded auto-handler: ${file}`);
      } catch (error) {
        console.error(`❌ Failed to load auto-handler: ${file}\nError: ${error.message}`);
      }
    } else {
      console.warn(`⚠️ Skipped ${file}: Not a valid handler (must export a function).`);
    }
  }

  console.log("✅ All auto-handlers successfully loaded.");
};