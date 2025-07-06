const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../../models/User/User');
const Test = require('../../models/Admin/TestSeries');
const Exam = require('../../models/Admin/Exam');

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_URL = process.env.CLERK_API_URL;

// 👉 Signup with Clerk
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  console.log("✅ Clerk URL:", process.env.CLERK_API_URL);

  try {
    const clerkRes = await axios.post(`${CLERK_API_URL}/users`, {
      email_address: [email],
      password,
    }, {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const clerkId = clerkRes.data.id;
    const newUser = new User({ clerkId, email, name });
    await newUser.save();

    res.status(201).json({ message: 'Signup successful', clerkId });
  } catch (err) {
    console.error('Signup error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Signup failed', details: err.response?.data });
  }
});

// 👉 Login (Validate Clerk token and fetch user)
router.post('/login', async (req, res) => {
  const { token } = req.body;

  try {
    const clerkRes = await axios.get(`${CLERK_API_URL}/sessions/${token}`, {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      },
    });

    const userId = clerkRes.data.user_id;
    const user = await User.findOne({ clerkId: userId });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'Login successful', user });
  } catch (err) {
    console.error('Login error:', err.response?.data || err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

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

// POST /api/auth/apply-exam - Apply for an exam
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
      if (!user.examinations.some(exam => exam.examName === (test.name || test.examName || 'Unknown Test'))) {
        user.examinations.push({
          examName: test.name || test.examName || 'Unknown Test',
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

// POST /api/auth/apply-test - Apply for a test
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
    const test = await Test.findOne(testQuery).select('name examName subject totalMarks');
    console.log('Test found:', test); // Debug log
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const existingExam = user.examinations.find((exam) => exam.examName === (test.name || test.examName || 'Unknown Test'));
    if (existingExam) {
      existingExam.score = null;
      existingExam.status = 'Pending';
      existingExam.examDate = new Date();
    } else {
      user.examinations.push({
        examName: test.name || test.examName || 'Unknown Test',
        examDate: new Date(),
        score: null,
        totalMarks: test.totalMarks || 0,
        subject: test.subject || 'Default Subject',
        status: 'Pending',
      });
    }

    await user.save();
    res.status(200).json({ message: 'Successfully applied for the test', user });
  } catch (error) {
    console.error('Apply test error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/submit-test - Submit answers for a test
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

    const test = await Test.findById(testId).select('questions totalMarks passingMarks name examName subject');
    console.log('Test for submission:', test); // Debug log
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const examEntry = user.examinations.find(
      (exam) => exam.examName === (test.name || test.examName || 'Unknown Test') && exam.status === 'Pending'
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

// GET /api/auth/applied-tests-exams - Get all applied tests and exams for a user
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
      const test = await Test.findOne({
        $or: [
          { name: examEntry.examName },
          { examName: examEntry.examName }
        ]
      }).select('name examName examId');
      let examName = 'Not linked to an exam';
      if (test && test.examId) {
        const exam = await Exam.findById(test.examId).select('name');
        examName = exam ? exam.name : 'Unknown Exam';
      }

      appliedDetails.push({
        testName: test ? (test.name || test.examName || 'Unknown Test') : examEntry.examName,
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