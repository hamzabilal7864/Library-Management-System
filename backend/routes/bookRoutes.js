const express = require('express');
const Book = require('../models/Book');

const router = express.Router();

// Route to add a new book
router.post('/add-book', async (req, res) => {
  try {
    const { title, author, genre, subGenre, height, publisher, quantity } = req.body;

    // Create a new book with the provided data
    const newBook = new Book({
      title,
      author,
      genre,
      subGenre,
      height,
      publisher,
      quantity: quantity || 1,  // Default quantity to 1 if not provided
    });

    // Save the new book to the database
    await newBook.save();

    res.status(201).json(newBook);
  } catch (error) {
    res.status(400).json({ message: 'Error adding book', error: error.message });
  }
});

// Route to fetch all books
router.get('/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    res.status(400).json({ message: 'Failed to load books', error: error.message });
  }
});

// Route to fetch a single book by ID
router.get('/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json(book);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching book data', error: error.message });
  }
});

// Route to update a book
router.put('/update-book/:id', async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update book', error: error.message });
  }
});

// Route to delete a book
router.delete('/delete-book/:id', async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to delete book', error: error.message });
  }
});

module.exports = router;
