const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function loadDatabase(client) {
    try {
        // MongoDB connection
        await mongoose.connect('mongodb+srv://ARVIND:Arvindk45612@arvind.urw2zqa.mongodb.net/?retryWrites=true&w=majority&appName=ARVIND', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Success message
        console.log('✅ MongoDB connected successfully!');

        // Dynamically load all schemas from the 'database' folder
        const schemaFiles = fs.readdirSync(path.join(__dirname, '../database')).filter(file => file.endsWith('.js'));

        client.schemas = {}; // Store schemas in the client object
        for (const file of schemaFiles) {
            const schema = require(`../database/${file}`);
            client.schemas[schema.modelName] = schema; // Add schema to client.schemas
        }

        console.log('✅ All schemas loaded successfully!');
    } catch (error) {
        // Error message
        console.error('❌ Error connecting to MongoDB:', error);
    }
}

module.exports = loadDatabase;