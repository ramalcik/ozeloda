const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  voiceChannelId: { type: String, required: true },
  textChannelId: { type: String, required: true },
  allowedUsers: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
