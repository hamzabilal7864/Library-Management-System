const express = require('express');
const Message = require('../models/Message');
const Student = require('../models/Student');
const Admin = require('../models/Adminn');
const verifyToken = require('../middleware/verifyToken.js'); // Ensure user is authenticated
const router = express.Router();

// POST: Send a message from student to admin
router.post('/send', verifyToken, async (req, res) => {
  const { content } = req.body;

  // Ensure the user is a student
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can send messages.' });
  }

  try {
    const student = await Student.findById(req.user.id);
    const admin = await Admin.findOne(); // Assuming one admin for simplicity

    const message = new Message({
      senderId: student._id,
      receiverId: admin._id,
      content,
    });

    await message.save();

    res.status(201).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Admin replies to a message
router.post('/reply/:messageId', verifyToken, async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;

  // Ensure the user is an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can reply to messages.' });
  }

  try {
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    const admin = await Admin.findById(req.user.id);
    const reply = new Message({
      senderId: admin._id,
      receiverId: originalMessage.senderId,
      content,
      isReply: true,
      repliedTo: originalMessage._id,
    });

    await reply.save();

    res.status(201).json({ message: 'Reply sent successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Admin sends a message to all students
router.post('/send-to-all', verifyToken, async (req, res) => {
  const { content } = req.body;

  // Ensure the user is an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can send messages to all students.' });
  }

  try {
    const students = await Student.find();

    const messages = students.map(async (student) => {
      const message = new Message({
        senderId: req.user.id, // Admin's ID
        receiverId: student._id, // Each student's ID
        content,
      });

      return await message.save();
    });

    await Promise.all(messages); // Wait for all messages to be saved

    res.status(201).json({ message: 'Message sent to all students.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: Get all messages for the logged-in user (Admin or Student)
router.get('/inbox', verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ senderId: req.user.id }, { receiverId: req.user.id }],
    }).populate('senderId receiverId'); // Populate sender and receiver info

    res.status(200).json({ messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/messages', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view all messages.' });
    }
  
    try {
      const messages = await Message.find({ receiverId: req.user.id })
        .populate('senderId receiverId') // Populate sender and receiver info
        .sort({ timestamp: -1 }); // Sort by most recent first
  
      res.status(200).json({ messages });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // GET: Get all students for dropdown
router.get('/students', verifyToken, async (req, res) => {
  try {
    const students = await Student.find({}, 'name _id'); // Fetch only name and _id
    res.status(200).json({ students });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Admin sends a message to a specific student
router.post('/send-to-student/:studentId', verifyToken, async (req, res) => {
  const { studentId } = req.params;
  const { content } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can send messages.' });
  }

  try {
    const message = new Message({
      senderId: req.user.id,
      receiverId: studentId,
      content,
    });

    await message.save();

    res.status(201).json({ message: 'Message sent to the student.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: Fetch admin messages for the logged-in student
router.get('/admin-messages', verifyToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can view admin messages.' });
  }

  try {
    const messages = await Message.find({
      senderId: { $ne: req.user.id }, // Not sent by the student
      receiverId: req.user.id, // Sent to the student
    })
      .populate('senderId', 'name') // Populate sender's name (admin)
      .sort({ createdAt: -1 }); // Sort by most recent

    res.status(200).json({ messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch admin messages.' });
  }
});


// DELETE: Delete a specific message
router.delete('/delete/:messageId', verifyToken, async (req, res) => {
  const { messageId } = req.params;

  // Ensure the user is an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can delete messages.' });
  }

  try {
    const message = await Message.findByIdAndDelete(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    res.status(200).json({ message: 'Message deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});




module.exports = router;
