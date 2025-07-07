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
    const students = await UserExam.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/exam/:id - Update user by MongoDB _id
router.put("/exam/:id", async (req, res) => {
  try {
    const updatedUser = await UserExam.findByIdAndUpdate(
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
router.delete("/user-exam/:id", async (req, res) => {
  try {
    const deletedUser = await UserExam.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User exam not found" });
    }

    res.json({ message: "User exam deleted successfully", user: deletedUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/apply/apply-exam - Apply for an exam // it Is in developement
router.post('/apply-exam', async (req, res) => {
  try {
    const { email, examId } = req.body;

    if (!email || !examId) {
      return res.status(400).json({ error: 'Email and examId are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const exam = await Exam.findById(examId).select('name');
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const tests = await Test.find({ examId }).select('name subject totalMarks');
    console.log('Tests found for exam:', tests); // Debug log
    if (tests.length === 0) {
      return res.status(404).json({ error: 'No tests found for this exam' });
    }

    tests.forEach(test => {
      if (!user.examinations.some(exam => exam.examName === (test.name || 'Unknown Test'))) {
        user.examinations.push({
          examName: test.name || 'Unknown Test',
          examDate: new Date(),
          score: null,
          totalMarks: test.totalMarks || 0,
          subject: test.subject || 'Default Subject',
          status: 'Pending',
        });
      }
    });

    await user.save();
    res.status(200).json({ message: 'Successfully applied for the exam', user });
  } catch (error) {
    console.error('Apply exam error:', error.message);
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

// POST /api/apply/submit-test - Submit answers for a test
router.post('/submit-test', async (req, res) => {
  try {
    const { userId, testId, answers } = req.body || {};

    if (!userId || !testId || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'userId, testId, and answers array are required' });
    }

    const userExam = await UserExam.findOne({ userId });
    if (!userExam) {
      return res.status(404).json({ error: 'User exam record not found' });
    }

    const test = await Test.findById(testId).select('questions totalMarks passingMarks name subject');
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const examEntry = userExam.examinations.find(
      (exam) => exam.testSeriesId.toString() === testId && exam.status === 'Pending'
    );

    if (!examEntry) {
      return res.status(400).json({ error: 'No pending test found for this user' });
    }

    // Calculate score
    let score = 0;
    test.questions.forEach((question, index) => {
      if (index < answers.length && answers[index] === question.correctAnswer) {
        score += question.marks;
      }
    });

    examEntry.score = score;
    examEntry.status = score >= test.passingMarks ? 'Passed' : 'Failed';
    examEntry.examDate = new Date();

    await userExam.save();

    res.status(200).json({
      message: 'Test submitted successfully',
      score,
      status: examEntry.status,
    });
  } catch (error) {
    console.error('Submit test error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/apply/applied-tests-exams?userId=6868c1d0ce8659d617025ee1 - Get all applied tests and exams for a user
router.get('/applied-tests-exams', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' }); // ✅ fixed message
    }

    const user = await UserExam.findOne({ userId }).populate({
      path: 'examinations.testSeriesId',
      select: 'name subject examId'
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.examinations || user.examinations.length === 0) {
      return res.status(200).json({ message: 'No tests or exams applied', data: [] });
    }

    const appliedDetails = [];

    for (const examEntry of user.examinations) {
      const test = examEntry.testSeriesId;

      let examName = 'Not linked to an exam';
      if (test && test.examId) {
        const exam = await Exam.findById(test.examId).select('name');
        examName = exam ? exam.name : 'Unknown Exam';
      }

      appliedDetails.push({
        testName: test?.name || 'Unknown Test',
        examName,
        subject: test?.subject || 'Unknown Subject',
        totalMarks: examEntry.totalMarks || 0,
        score: examEntry.score ?? null,
        status: examEntry.status,
        examDate: examEntry.examDate || null,
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