// routes/examResult.js

const express = require('express');
const router = express.Router();
const ExamResult = require('../../models/Admin/ExamResult');
const User = require('../../models/User/User');
const TestSeries = require('../../models/Admin/TestSeries');

// POST /api/exam-results/:userId
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { testSeriesId, score, status } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if test series exists
    const testSeries = await TestSeries.findById(testSeriesId);
    if (!testSeries) {
      return res.status(404).json({ error: 'Test Series not found' });
    }

    // Create and save new exam result
    const newResult = new ExamResult({
      userId,
      testSeriesId,
      score,
      status // optional
    });

    await newResult.save();

    res.status(201).json({ message: 'Exam result added successfully', result: newResult });
  } catch (err) {
    console.error('Error adding exam result:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all results for a user with test series details
router.get('/:userId/results', async (req, res) => {
  try {
    const { userId } = req.params;

    const results = await ExamResult.find({ userId })
      .populate('testSeriesId') // Make sure 'TestSeries' model name is correct
      .populate('userId');      // Optional

    res.status(200).json(results);
  } catch (err) {
    console.error("Detailed Error:", err); // 👈 Add this for debugging
    res.status(500).json({ error: 'Error fetching results' });
  }
});

// GET a specific exam result for a user by userId and testSeriesId
router.get('/:userId/:testSeriesId', async (req, res) => {
  try {
    const { userId, testSeriesId } = req.params;

    const result = await ExamResult.findOne({
      userId,
      testSeriesId
    })
    .populate('testSeriesId')  // Optional: populate test series details
    .populate('userId');       // Optional: populate user details

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const totalMarks = result.testSeriesId.totalMarks || 100; // fallback to 100 if missing
    const score = result.score || 0;
    const percentage = ((score / totalMarks) * 100).toFixed(2);

    // Calculate grade
    let grade;
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else grade = 'F';

    // Return result with percentage and grade
    res.status(200).json({
      ...result._doc,      // Spread result fields
      percentage: `${percentage}%`,
      grade
    });
  } catch (err) {
    console.error('Error fetching specific exam result:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
