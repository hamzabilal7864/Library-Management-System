  const mongoose = require('mongoose');

  const issuedBookSchema = new mongoose.Schema({
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    returnDate: {
      type: Date,
      default: null,
    },
  });

  module.exports = mongoose.model('IssuedBook', issuedBookSchema);
