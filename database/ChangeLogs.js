const mongoose = require('mongoose');

const changeLogSchema = new mongoose.Schema({
  latest: { type: String, required: true },
  previous: { type: String, default: null },
  announcement: { type: String, default: null }, // New field
});

module.exports = mongoose.model('ChangeLog', changeLogSchema);