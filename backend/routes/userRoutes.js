const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Admin = require('../models/Adminn'); // Corrected import
const Student = require('../models/Student'); // Corrected import
const router = express.Router();

// Load environment variables
dotenv.config();

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

// Register a new user (Admin or Student)
router.post('/signup', async (req, res) => {
  const { name, email, password, role, adminKey, branch } = req.body;

  try {
    if (role === 'admin') {
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(400).json({ message: 'Invalid admin key' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = new Admin({ name, email, password: hashedPassword, role });
      await admin.save();
      return res.status(201).json({ message: 'Admin created successfully!' });
    } else if (role === 'student') {
      const hashedPassword = await bcrypt.hash(password, 10);
      const student = new Student({ name, email, password: hashedPassword, role, branch });
      await student.save();
      return res.status(201).json({ message: 'Student created successfully!' });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login a user
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = role === 'admin' ? await Admin.findOne({ email }) : await Student.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token, user: { id: user._id, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = req.user.role === 'admin'
      ? await Admin.findById(req.user.id).select('-password')
      : await Student.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// Add a new student
router.post('/add', async (req, res) => {
  const { name, email, branch, password } = req.body;

  if (!name || !email || !branch || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newStudent = new Student({ name, email, branch, password: hashedPassword });
    await newStudent.save();
    res.status(201).json({ message: 'Student added successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding student' });
  }
});

// Update a student
router.put('/update/:id', async (req, res) => {
  const { name, email, branch, password } = req.body;

  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.name = name || student.name;
    student.email = email || student.email;
    student.branch = branch || student.branch;
    if (password) student.password = await bcrypt.hash(password, 10);

    await student.save();
    res.json({ message: 'Student updated successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating student' });
  }
});

// Delete a student
router.delete('/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student' });
  }
});

module.exports = router;
