const express = require('express');
const jwt = require('jsonwebtoken');
const Book = require('../models/Book');
const Student = require('../models/Student');
const IssueRequest = require('../models/issue');  // Import IssueRequest model

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Save user info in request
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin Route to Fetch Dashboard Statistics
router.get('/statistics', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied, admin only' });
  }

  try {
    // Fetch statistics
    const totalBooks = await Book.countDocuments();
     // Modify to count only approved issued books
    const returnedBooks = await Book.countDocuments({ status: 'returned' });
    const totalStudents = await Student.countDocuments();

    // Fetch issue requests statistics
    const issuedBooksApproved = await IssueRequest.countDocuments({ status:  'Approved' });
    const pendingBooks = await IssueRequest.countDocuments({ status: 'Pending' });
    const pendingReturnedBooks = await IssueRequest.countDocuments({ status: 'Returned' });

    // Send statistics data to frontend
    res.json({
      totalBooks,
      issuedBooks: issuedBooksApproved,  // Send approved issued books count
      returnedBooks,
      totalStudents,
      pendingBooks,          // Count of books pending approval
      pendingReturnedBooks  // Count of books pending return
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});


module.exports = router;
