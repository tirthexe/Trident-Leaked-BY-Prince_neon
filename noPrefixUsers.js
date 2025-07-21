const fs = require('fs');
const path = '../noPrefixUsers.json'; // Path to the NP user list file

let npUsers = new Set();

// Load NP users from JSON file
function loadNpUsers() {
  if (fs.existsSync(path)) {
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    npUsers = new Set(data.noPrefixUsers || []);
  } else {
    npUsers = new Set();
  }
}

// Save NP users to JSON file
function saveNpUsers() {
  const data = { noPrefixUsers: Array.from(npUsers) };
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// Load NP users on startup
loadNpUsers();

module.exports = {
  npUsers,
  saveNpUsers
};