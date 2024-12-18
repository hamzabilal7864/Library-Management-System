const mongoose = require('mongoose');

const issueRequestSchema = new mongoose.Schema({
  bookTitle: { type: String, required: true },
  bookAuthor: { type: String, required: true },
  studentName: { type: String, required: true },
  studentBranch: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected' , 'Returned'], default: 'Pending' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
}, { timestamps: true });

const IssueRequest = mongoose.model('IssueRequest', issueRequestSchema);

module.exports = IssueRequest;
