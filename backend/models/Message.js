const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true }, // The sender is a student
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }, // The receiver is the admin
  content: { type: String, required: true }, // The content of the message
  isReply: { type: Boolean, default: false }, // To differentiate between replies and original messages
  repliedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }, // The message that was replied to
  timestamp: { type: Date, default: Date.now }, // Timestamp for the message
});

module.exports = mongoose.model('Message', messageSchema);
