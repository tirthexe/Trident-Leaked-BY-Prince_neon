const mongoose = require('mongoose');

const autoVoiceSetupSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  categoryId: {
    type: String,
    required: true,
  },
  controllerChannelId: {
    type: String,
    required: true,
  },
  voiceChannelId: {
    type: String,
    required: true,
  },
  normalText: {
    type: String,
    default: null,
  },
  embedText: {
    type: String,
    default: null,
  },
  enabled: {
    type: Boolean,
    default: false,
  },
  controllerMessageId: {
    type: String,
    default: null,
  },
  customVoiceChannels: [
    {
      channelId: {
        type: String,
        required: true,
      },
      ownerId: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model('AutoVoiceSetup', autoVoiceSetupSchema);