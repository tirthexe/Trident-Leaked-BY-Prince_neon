// db/Blacklist.js
const db = require("./index");

async function findOne(query) {
  if (query.userId) {
    const row = db.prepare(`SELECT * FROM blacklist WHERE userId = ?`).get(query.userId);
    return row || null;
  }
  return null;
}

async function create({ userId, reason, bypass = 0 }) {
  const exists = db.prepare(`SELECT 1 FROM blacklist WHERE userId = ?`).get(userId);
  if (!exists) {
    db.prepare(`INSERT INTO blacklist (userId, reason, bypass) VALUES (?, ?, ?)`).run(userId, reason, bypass);
  }
}

async function deleteOne(query) {
  if (query.userId) {
    db.prepare(`DELETE FROM blacklist WHERE userId = ?`).run(query.userId);
  }
}

module.exports = { findOne, create, deleteOne };