const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../../models/User/User');
const Test = require('../../models/Admin/TestSeries');
const Exam = require('../../models/Admin/Exam');
const UserExam = require('../../models/User/UserExamSchema');

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_URL = process.env.CLERK_API_URL;


// GET /api/students - Get all students
router.get("/students", async (req, res) => {
  try {
    const students = await User.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id - Update user by MongoDB _id
router.put("/users/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/users/:id - Delete user by MongoDB _id
router.delete("/users/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully", user: deletedUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/apply/apply-exam - Apply for an exam
router.post('/apply-test', async (req, res) => {
  try {
    const { email, testId, testName } = req.body;

    if (!email || (!testId && !testName)) {
      return res.status(400).json({ error: 'Email and either testId or testName are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const testQuery = testId ? { _id: testId } : { name: testName };
    const test = await Test.findOne(testQuery).select('name totalMarks');
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Get or create UserExam document
    let userExam = await UserExam.findOne({ userId: user._id });

    if (!userExam) {
      // If none exists, create new one with the current test
      userExam = new UserExam({
        userId: user._id,
        examinations: [{
          testSeriesId: test._id,
          totalMarks: test.totalMarks || 0,
          status: 'Pending',
        }],
      });
    } else {
      // Ensure examinations array exists
      if (!Array.isArray(userExam.examinations)) {
        userExam.examinations = [];
      }

      const alreadyApplied = userExam.examinations.some(
        (exam) => exam.testSeriesId.toString() === test._id.toString()
      );

      if (!alreadyApplied) {
        userExam.examinations.push({
          testSeriesId: test._id,
          totalMarks: test.totalMarks || 0,
          status: 'Pending',
        });
      }
    }

    await userExam.save();

    res.status(200).json({ message: 'Successfully applied for the test', userExam });

  } catch (error) {
    console.error('Apply test error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/apply/apply-test - Apply for a single test
router.post('/apply-test', async (req, res) => {
  try {
    const { email, testId, testName } = req.body;

    if (!email || (!testId && !testName)) {
      return res.status(400).json({ error: 'Email and either testId or testName are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const testQuery = testId ? { _id: testId } : { name: testName };
    const test = await Test.findOne(testQuery).select('name totalMarks');
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    let userExam = await UserExam.findOne({ userId: user._id });

    if (!userExam) {
      userExam = new UserExam({
        userId: user._id,
        examinations: [],
      });
    }
if (!userExam) {
  userExam = new UserExam({
    userId: user._id,
    examinations: []
  });
}

if (!Array.isArray(userExam.examinations)) {
  userExam.examinations = [];
}

    const alreadyApplied = UserExam.examinations.some(
      (exam) => exam.testSeriesId.toString() === test._id.toString()
    );

    if (!alreadyApplied) {
      userExam.examinations.push({
        testSeriesId: test._id,
        totalMarks: test.totalMarks || 0,
        status: 'Pending',
      });
    } else {
      // Optional: update status back to 'Pending'
      userExam.examinations = userExam.examinations.map((exam) => {
        if (exam.testSeriesId.toString() === test._id.toString()) {
          exam.status = 'Pending';
          exam.score = null;
        }
        return exam;
      });
    }

    await userExam.save();

    res.status(200).json({ message: 'Successfully applied for the test', userExam });
  } catch (error) {
    console.error('Apply test error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/apply/submit-test - Submit answers for a test
router.post('/submit-test', async (req, res) => {
  try {
    const { email, testId, answers } = req.body || {};

    if (!email || !testId || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Email, testId, and answers array are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const test = await Test.findById(testId).select('questions totalMarks passingMarks name subject');
    console.log('Test for submission:', test); // Debug log
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const examEntry = user.examinations.find(
      (exam) => exam.examName === (test.name || 'Unknown Test') && exam.status === 'Pending'
    );
    if (!examEntry) {
      return res.status(400).json({ error: 'User has not applied for this test or test is already submitted' });
    }

    let score = 0;
    if (answers.length === 0) {
      score = 0;
    } else {
      test.questions.forEach((question, index) => {
        if (index < answers.length && answers[index] === question.correctAnswer) {
          score += question.marks;
        }
      });
    }

    examEntry.score = score;
    examEntry.status = score >= test.passingMarks ? 'Passed' : 'Failed';
    examEntry.examDate = new Date();

    await user.save();
    res.status(200).json({
      message: 'Test submitted successfully',
      score,
      status: examEntry.status,
      user,
    });
  } catch (error) {
    console.error('Submit test error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/apply/applied-tests-exams - Get all applied tests and exams for a user
router.get('/applied-tests-exams', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email }).select('examinations');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.examinations || user.examinations.length === 0) {
      return res.status(200).json({ message: 'No tests or exams applied', data: [] });
    }

    const appliedDetails = [];
    for (const examEntry of user.examinations) {
      const test = await Test.findOne({ name: examEntry.examName }).select('name examId');
      let examName = 'Not linked to an exam';
      if (test && test.examId) {
        const exam = await Exam.findById(test.examId).select('name');
        examName = exam ? exam.name : 'Unknown Exam';
      }

      appliedDetails.push({
        testName: examEntry.examName,
        examName,
        subject: examEntry.subject || 'Default Subject',
        totalMarks: examEntry.totalMarks || 0,
        score: examEntry.score,
        status: examEntry.status,
        examDate: examEntry.examDate,
      });
    }

    res.status(200).json({
      message: 'Successfully retrieved applied tests and exams',
      totalApplied: appliedDetails.length,
      data: appliedDetails,
    });
  } catch (error) {
    console.error('Applied tests/exams error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;