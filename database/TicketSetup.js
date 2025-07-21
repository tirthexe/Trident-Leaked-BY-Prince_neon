const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  channelId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  closeButtonId: { type: String },
  deleteButtonId: { type: String },
  reopenButtonId: { type: String },
  status: { type: String, enum: ['open', 'closed', 'deleted'], default: 'open' },
  renameTimestamps: { type: [Date], default: [] }, // NEW: Track last 2 rename times
});

const TicketPanelSchema = new mongoose.Schema({
  panelName: { type: String, required: true },
  categoryId: { type: String },
  ticketChannel: { type: String },
  supportRole: { type: String },
  logsChannel: { type: String },

  // Panel messages
  panelNormalMessage: { type: String },
  panelEmbedMessage: { type: String },
  panelEmbedImage: { type: String },

  // Open messages
  panelOpenNormalMessage: { type: String },
  panelOpenEmbedMessage: { type: String },

  // Ping messages
  panelPingNormalMessage: { type: String },
  panelPingEmbedMessage: { type: String },

  // Button customization
  panelButtonName: { type: String },
  panelButtonEmoji: { type: String },

  // Panel Control
  panelButtonId: { type: String },
  panelMessageId: { type: String },
  enabled: { type: Boolean, default: false },

  tickets: [TicketSchema],
});

const TicketSetupSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  panels: [TicketPanelSchema],
});

module.exports = mongoose.model('TicketSetup', TicketSetupSchema);