const express = require('express');
const mongoose = require('mongoose');
const IssuedBook = require('../models/issueBook'); // Import the IssuedBook model

const router = express.Router();

// Route to fetch issued books for a student
router.get('/issued-books', async (req, res) => {
  const { studentId } = req.query; // Retrieve studentId from query parameters

  if (!studentId) {
    return res.status(400).json({ message: 'Student ID is required' }); // Handle missing studentId
  }

  try {
    // Fetch the issued books for the specific student
    const issuedBooks = await IssuedBook.find({ studentId }) // Find issued books for this studentId
      .populate('bookId') // Populate the 'bookId' field with book details
      .populate('studentId'); // Optionally populate the 'studentId' field with student details

    if (!issuedBooks || issuedBooks.length === 0) {
      return res.status(404).json({ message: 'No issued books found for this student' });
    }

    // If issued books are found, return them with populated book details
    const books = issuedBooks.map(issue => ({
      book: issue.bookId,
      issueDate: issue.issueDate,
      returnDate: issue.returnDate,
    }));

    return res.json(books); // Respond with the issued books data
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message }); // Handle errors
  }
});




module.exports = router;

