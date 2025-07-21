const mongoose = require('mongoose');

const liveLeaderboardSchema = new mongoose.Schema({
guildId: { type: String, required: true, unique: true },

messagesWeekly: String,
messagesWeeklyMid: String,

messagesDaily: String,
messagesDailyMid: String,

messagesAll: String,
messagesAllMid: String,

messagesMonthly: String,
messagesMonthlyMid: String,

voiceWeekly: String,
voiceWeeklyMid: String,

voiceDaily: String,
voiceDailyMid: String,

voiceAll: String,
voiceAllMid: String,

voiceMonthly: String,
voiceMonthlyMid: String
});

module.exports = mongoose.model('LiveLeaderboard', liveLeaderboardSchema);