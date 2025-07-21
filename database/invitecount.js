const mongoose = require('mongoose');

const userInviteStatsSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // The inviter's ID

  // JOIN COUNTS
  allTimeJoin: { type: Number, default: 0 },
  monthJoin: { type: Number, default: 0 },
  todayJoin: { type: Number, default: 0 },
  yesterdayJoin: { type: Number, default: 0 },

  // LEFT COUNTS
  allTimeLeft: { type: Number, default: 0 },
  monthLeft: { type: Number, default: 0 },
  todayLeft: { type: Number, default: 0 },
  yesterdayLeft: { type: Number, default: 0 },

  // REJOIN COUNTS
  allTimeRejoin: { type: Number, default: 0 },
  monthRejoin: { type: Number, default: 0 },
  todayRejoin: { type: Number, default: 0 },
  yesterdayRejoin: { type: Number, default: 0 },

  // FAKE COUNTS
  allTimeFake: { type: Number, default: 0 },
  monthFake: { type: Number, default: 0 },
  todayFake: { type: Number, default: 0 },
  yesterdayFake: { type: Number, default: 0 },

  // UNIQUE USERS
  joined: [{ type: String }],  // All user IDs who joined via this inviter
  lefted: [{ type: String }]   // All user IDs who left after joining
}, { _id: false });

const inviteCountSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enable: { type: Boolean, default: false },

  users: [userInviteStatsSchema]
});

module.exports = mongoose.model('invitecount', inviteCountSchema);