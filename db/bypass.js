const db = require("./index");

// Create the bypass table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS bypass (
    userId TEXT PRIMARY KEY
  )
`).run();

async function findOne(query) {
  if (query.userId) {
    const row = db.prepare(`SELECT * FROM bypass WHERE userId = ?`).get(query.userId);
    return row || null;
  }
  return null;
}

async function create({ userId }) {
  const exists = db.prepare(`SELECT 1 FROM bypass WHERE userId = ?`).get(userId);
  if (!exists) {
    db.prepare(`INSERT INTO bypass (userId) VALUES (?)`).run(userId);
  }
}

async function deleteOne(query) {
  if (query.userId) {
    db.prepare(`DELETE FROM bypass WHERE userId = ?`).run(query.userId);
  }
}

module.exports = { findOne, create, deleteOne };