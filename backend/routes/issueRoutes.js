const express = require('express');
const jwt = require('jsonwebtoken');

const IssueRequest = require('../models/issue');
const Book = require('../models/Book');
const Student = require('../models/Student');
const IssuedBook = require('../models/issueBook');

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied, admin only' });
  }
  next();
};

// Request a book
router.post('/new/request', verifyToken, async (req, res) => {
  const { bookId } = req.body;
  try {
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const existingRequest = await IssueRequest.findOne({
      studentId: req.user.id,
      bookId,
      status: 'Pending',
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request for this book' });
    }

    const issueRequest = new IssueRequest({
      studentId: req.user.id,
      bookId,
      studentName: student.name,
      studentBranch: student.branch,
      bookTitle: book.title,
      bookAuthor: book.author,
      status: 'Pending',
    });
    await issueRequest.save();

    res.status(201).json({ message: 'Book issue request created', request: issueRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Fetch all requests (Admin only)
router.get('/requests', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const requests = await IssueRequest.find();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching requests', error: err.message });
  }
});

// Approve a request (Admin only)
router.post('/approve', verifyToken, verifyAdmin, async (req, res) => {
  const { requestId } = req.body;
  try {
    const request = await IssueRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    const book = await Book.findById(request.bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    if (book.quantity <= 0) {
      return res.status(400).json({ message: 'Book not available for issue' });
    }

    const student = await Student.findById(request.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Approve the request
    request.status = 'Approved';
    await request.save();

    // Create a new IssuedBook record with returnDate set to 10 days ago
    const issuedBook = new IssuedBook({
      studentId: request.studentId,
      bookId: request.bookId,
      issueDate: new Date(),
      returnDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    });
    await issuedBook.save();

    // Decrease book quantity
    book.quantity -= 1;
    await book.save();

    res.json({
      message: `Book '${book.title}' has been issued to '${student.name}'.`,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error processing request', error: err.message });
  }
});


// Reject a request (Admin only)
router.post('/reject', verifyToken, verifyAdmin, async (req, res) => {
  const { requestId } = req.body;
  try {
    const request = await IssueRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.status === 'Approved' || request.status === 'Rejected') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    request.status = 'Rejected';
    await request.save();

    res.json({ message: 'Request rejected successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error rejecting request', error: err.message });
  }
});

// Delete all approved or rejected requests (Admin only)
router.post('/delete-all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // Delete all requests that are approved or rejected
    const deletedRequests = await IssueRequest.deleteMany({
      status: { $in: [ 'Returned'] }
    });

    if (deletedRequests.deletedCount === 0) {
      return res.status(404).json({ message: 'There is no book to delete ' });
    }

    res.json({ message: `${deletedRequests.deletedCount} requests deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting requests', error: err.message });
  }
});

// Route to get all issued books (Admin only or a specific student)
router.get('/issued-books', verifyToken, async (req, res) => {
  try {
    const issuedBooks = await IssuedBook.find()
      .populate('studentId', 'name branch')
      .populate('bookId', 'title author')
      .exec();
    res.json(issuedBooks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching issued books', error: err.message });
  }
});

// Cancel the issue of a book and update the request status to 'Returned'
router.post('/cancel-issue', verifyToken, async (req, res) => {
  const { issueId } = req.body;
  try {
    // Find the issued book record
    const issuedBook = await IssuedBook.findById(issueId);
    if (!issuedBook) return res.status(404).json({ message: 'Issued book not found' });

    // Find the corresponding issue request based on studentId and bookId
    const issueRequest = await IssueRequest.findOne({
      studentId: issuedBook.studentId,
      bookId: issuedBook.bookId,
      status: 'Approved',
    });

    if (!issueRequest) {
      return res.status(404).json({ message: 'Corresponding issue request not found' });
    }

    // Update the issue request status to 'Returned'
    issueRequest.status = 'Returned';
    await issueRequest.save();

    // Remove the issued book record
    await IssuedBook.findByIdAndDelete(issueId);

    // Optionally, you may want to increase the book quantity if needed.
    const book = await Book.findById(issuedBook.bookId);
    if (book) {
      book.quantity += 1;  // Replenishing the book stock
      await book.save();
    } else {
      return res.status(404).json({ message: 'Book not found for updating stock' });
    }

    res.json({ message: 'Book issue canceled and request marked as returned' });
  } catch (err) {
    console.error(err); // Add logging for debugging
    res.status(500).json({ message: 'Error canceling book issue', error: err.message });
  }
});


















module.exports = router;
