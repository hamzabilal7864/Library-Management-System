// models/Book.js
const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: { type: String },
  subGenre: { type: String },
  height: { type: Number },
  publisher: { type: String },
  quantity: { type: Number, default: 1 }, // Tracks availability (copies)
});

module.exports = mongoose.model('Book', BookSchema);
