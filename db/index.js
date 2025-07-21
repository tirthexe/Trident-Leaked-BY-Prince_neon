// db/index.js
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "database.sqlite");
const db = new Database(dbPath);

// Create the blacklist table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS blacklist (
    userId TEXT PRIMARY KEY,
    reason TEXT,
    bypass INTEGER DEFAULT 0
  )
`).run();

// Create bypass table
db.prepare(`
  CREATE TABLE IF NOT EXISTS bypass (
    userId TEXT PRIMARY KEY
  )
`).run();


module.exports = db;