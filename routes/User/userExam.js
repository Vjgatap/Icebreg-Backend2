const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const User = require('../../models/User/User');
const Test = require('../../models/Admin/TestSeries');
const Exam = require('../../models/Admin/Exam');
const UserExam = require('../../models/User/UserExamSchema');

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_URL = process.env.CLERK_API_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Debug logging for models
console.log('User model:', User ? 'Defined' : 'Undefined');
console.log('Test model:', Test ? 'Defined' : 'Undefined');
console.log('Exam model:', Exam ? 'Defined' : 'Undefined');
console.log('UserExam model:', UserExam ? 'Defined' : 'Undefined');
console.log('Supabase client:', supabase ? 'Initialized' : 'Not initialized');

// GET /api/students - Get all students
router.get("/students", async (req, res) => {
  try {
    const students = await UserExam.find();
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/exam/:id - Update user exam by MongoDB _id
router.put("/exam/:id", async (req, res) => {
  try {
    const updatedUser = await UserExam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User exam not found" });
    }
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user exam error:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/users/:id - Delete user exam by MongoDB _id
router.delete("/user-exam/:id", async (req, res) => {
  try {
    const deletedUser = await UserExam.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User exam not found" });
    }
    res.json({ message: "User exam deleted successfully", user: deletedUser });
  } catch (error) {
    console.error('Delete user exam error:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /api/apply/apply-exam - Apply for an exam
router.post('/apply-exam', async (req, res) => {
  try {
    const { email, examId } = req.body;
    console.log('Apply exam request body:', { email, examId });
    if (!email || !examId) {
      return res.status(400).json({ error: 'Email and examId are required' });
    }
    if (!User) {
      throw new Error('User model is undefined');
    }
    const user = await User.findOne({ email });
    console.log('User found:', user ? user._id : 'None');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!Exam) {
      throw new Error('Exam model is undefined');
    }
    const exam = await Exam.findById(examId).select('name');
    console.log('Exam found:', exam ? exam._id : 'None');
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    if (!Test) {
      throw new Error('Test model is undefined');
    }
    const tests = await Test.find({ examId }).select('name totalMarks');
    console.log('Tests found for exam:', tests);
    if (tests.length === 0) {
      return res.status(404).json({ error: 'No tests found for this exam' });
    }
    let userExam = await UserExam.findOne({ userId: user._id });
    console.log('UserExam found:', userExam ? userExam._id : 'None');
    if (!userExam) {
      userExam = new UserExam({
        userId: user._id,
        examinations: []
      });
    }
    tests.forEach(test => {
      if (!userExam.examinations.some(exam => exam.testSeriesId.toString() === test._id.toString())) {
        userExam.examinations.push({
          testSeriesId: test._id,
          totalMarks: test.totalMarks || 0,
          status: 'Pending',
        });
      }
    });
    await userExam.save();
    res.status(200).json({ message: 'Successfully applied for the exam', userExam });
  } catch (error) {
    console.error('Apply exam error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/apply/apply-test - Apply for a single test
router.post('/apply-test', async (req, res) => {
  try {
    const { email, testId, testName } = req.body;
    console.log('Apply test request body:', { email, testId, testName });
    if (!email || (!testId && !testName)) {
      return res.status(400).json({ error: 'Email and either testId or testName are required' });
    }
    if (!User) {
      throw new Error('User model is undefined');
    }
    const user = await User.findOne({ email });
    console.log('User found:', user ? user._id : 'None');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!Test) {
      throw new Error('Test model is undefined');
    }
    const testQuery = testId ? { _id: testId } : { name: testName };
    const test = await Test.findOne(testQuery).select('name totalMarks');
    console.log('Test found:', test ? test._id : 'None');
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    if (!UserExam) {
      throw new Error('UserExam model is undefined');
    }
    let userExam = await UserExam.findOne({ userId: user._id });
    console.log('UserExam found:', userExam ? userExam._id : 'None');
    if (!userExam) {
      userExam = new UserExam({
        userId: user._id,
        examinations: [{
          testSeriesId: test._id,
          totalMarks: test.totalMarks || 0,
          status: 'Pending',
        }],
      });
    } else {
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
    console.error('Apply test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/apply/submit-test - Submit answers for a test
// router.post('/submit-test', async (req, res) => {
//   try {
//     const { userId, testId, answers } = req.body || {};
//     console.log('Submit test request body:', { userId, testId, answers });
//     if (!userId || !testId || !Array.isArray(answers)) {
//       return res.status(400).json({ error: 'userId, testId, and answers array are required' });
//     }
//     if (!UserExam) {
//       throw new Error('UserExam model is undefined');
//     }
//     const userExam = await UserExam.findOne({ userId });
//     console.log('UserExam found:', userExam ? userExam._id : 'None');
//     if (!userExam) {
//       return res.status(404).json({ error: 'User exam record not found' });
//     }
//     if (!Test) {
//       throw new Error('Test model is undefined');
//     }
//     const test = await Test.findById(testId).select('questions totalMarks passingMarks name');
//     console.log('Test found:', test ? test._id : 'None');
//     if (!test) {
//       return res.status(404).json({ error: 'Test not found' });
//     }
//     const examEntry = userExam.examinations.find(
//       (exam) => exam.testSeriesId.toString() === testId && exam.status === 'Pending'
//     );
//     if (!examEntry) {
//       return res.status(400).json({ error: 'No pending test found for this user' });
//     }
//     let score = 0;
//     test.questions.forEach((question, index) => {
//       if (index < answers.length && answers[index] === question.correctAnswer) {
//         score += question.marks;
//       }
//     });
//     examEntry.score = score;
//     examEntry.status = score >= test.passingMarks ? 'Passed' : 'Failed';
//     examEntry.examDate = new Date();
//     await userExam.save();
//     res.status(200).json({
//       message: 'Test submitted successfully',
//       score,
//       status: examEntry.status,
//     });
//   } catch (error) {
//     console.error('Submit test error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });
// router.post('/submit-test', async (req, res) => {
//   try {
//     let { userId, testId, answers } = req.body || {};
//     console.log('Submit test request body:', { userId, testId, answers });

//     if (!userId || !testId || !answers) {
//       return res.status(400).json({ error: 'userId, testId, and answers are required' });
//     }

//     // ✅ Convert answers object → array if needed
//     if (!Array.isArray(answers) && typeof answers === "object") {
//       answers = Object.values(answers);
//     }

//     if (!Array.isArray(answers)) {
//       return res.status(400).json({ error: 'answers must be an array or object' });
//     }

//     if (!UserExam) throw new Error('UserExam model is undefined');

//     const userExam = await UserExam.findOne({ userId });
//     console.log('UserExam found:', userExam ? userExam._id : 'None');
//     if (!userExam) return res.status(404).json({ error: 'User exam record not found' });

//     if (!Test) throw new Error('Test model is undefined');

//     const test = await Test.findById(testId).select('questions totalMarks passingMarks name');
//     console.log('Test found:', test ? test._id : 'None');
//     if (!test) return res.status(404).json({ error: 'Test not found' });

//     const examEntry = userExam.examinations.find(
//       (exam) => exam.testSeriesId.toString() === testId && exam.status === 'Pending'
//     );
//     if (!examEntry) {
//       return res.status(400).json({ error: 'No pending test found for this user' });
//     }

//     let score = 0;
//     test.questions.forEach((question, index) => {
//       if (index < answers.length && answers[index] === question.correctAnswer) {
//         score += question.marks;
//       }
//     });

//     examEntry.score = score;
//     examEntry.status = score >= test.passingMarks ? 'Passed' : 'Failed';
//     examEntry.examDate = new Date();
//     await userExam.save();

//     res.status(200).json({
//       message: 'Test submitted successfully',
//       score,
//       status: examEntry.status,
//     });
//   } catch (error) {
//     console.error('Submit test error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });
router.post('/submit-test', async (req, res) => {
  try {
    let { userId, testId, answers } = req.body || {};
    console.log('Submit test request body:', { userId, testId, answers });

    if (!userId || !testId || !answers) {
      return res.status(400).json({ error: 'userId, testId, and answers are required' });
    }

    // ✅ Convert answers object → array if needed
    if (!Array.isArray(answers) && typeof answers === "object") {
      answers = Object.values(answers);
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'answers must be an array or object' });
    }

    if (!UserExam) throw new Error('UserExam model is undefined');

    const userExam = await UserExam.findOne({ userId });
    console.log('UserExam found:', userExam ? userExam._id : 'None');
    if (!userExam) return res.status(404).json({ error: 'User exam record not found' });

    if (!Test) throw new Error('Test model is undefined');

    const test = await Test.findById(testId).select('questions totalMarks passingMarks name');
    console.log('Test found:', test ? test._id : 'None');
    if (!test) return res.status(404).json({ error: 'Test not found' });

    const examEntry = userExam.examinations.find(
      (exam) => exam.testSeriesId.toString() === testId && exam.status === 'Pending'
    );
    if (!examEntry) {
      return res.status(400).json({ error: 'No pending test found for this user' });
    }

    // ✅ Store answers with questionId reference
    let score = 0;
    examEntry.answers = []; // reset if already exists
    test.questions.forEach((question, index) => {
      const userAnswer = answers[index]; // assuming same order
      if (userAnswer) {
        examEntry.answers.push({
          questionId: question._id,
          answer: userAnswer
        });

        // ✅ Scoring
        if (userAnswer === question.correctAnswer) {
          score += question.marks;
        }
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
      answers: examEntry.answers
    });
  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ PUT: Add/Update examination for a user
router.put("/examinations", async (req, res) => {
  try {
    const { userId, testSeriesId, totalMarks } = req.body;

    if (!userId || !testSeriesId || !totalMarks) {
      return res.status(400).json({ error: "userId, testSeriesId, and totalMarks are required" });
    }

    // ✅ Check if user exam record exists
    let userExam = await UserExam.findOne({ userId });

    if (!userExam) {
      // If no record exists → create new one with first exam
      userExam = new UserExam({
        userId,
        examinations: [
          {
            testSeriesId,
            totalMarks,
            status: "Pending",
          },
        ],
      });
    } else {
      // ✅ Check if exam already exists in examinations
      const examExists = userExam.examinations.find(
        (exam) => exam.testSeriesId.toString() === testSeriesId
      );

      if (examExists) {
        // If exam already exists → just update marks/status if needed
        examExists.totalMarks = totalMarks;
        examExists.status = "Pending"; // reset status if you want
        examExists.score = 0;
        examExists.answers = [];
        examExists.examDate = null;
      } else {
        // If not exists → push new exam entry
        userExam.examinations.push({
          testSeriesId,
          totalMarks,
          status: "Pending",
        });
      }
    }

    await userExam.save();

    res.status(200).json({
      message: "Examination updated successfully",
      userExam,
    });
  } catch (error) {
    console.error("Update examination error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET: All user exams with populated test + questions
router.get("/examinations", async (req, res) => {
  try {
    const userExams = await UserExam.find()
      .populate({
        path: "examinations.testSeriesId",
        model: "Test",
        select: "name questions totalMarks passingMarks duration description", 
      })
      .populate("userId", "name email"); // optional: get user details

    res.status(200).json(userExams);
  } catch (error) {
    console.error("Fetch all exams error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Exams for a single user
router.get("/examinations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const userExam = await UserExam.findOne({ userId })
      .populate({
        path: "examinations.testSeriesId",
        model: "Test",
        select: "name questions totalMarks passingMarks duration description",
      })
      .populate("userId", "name email");

    if (!userExam) {
      return res.status(404).json({ error: "No exam records found for this user" });
    }

    res.status(200).json(userExam);
  } catch (error) {
    console.error("Fetch user exams error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/apply/applied-tests-exams - Get all applied tests and exams for a user
router.get('/applied-tests-exams', async (req, res) => {
  try {
    const { userId } = req.query;
    console.log('Applied tests/exams request query:', { userId });
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (!UserExam) {
      throw new Error('UserExam model is undefined');
    }
    const user = await UserExam.findOne({ userId }).populate({
      path: 'examinations.testSeriesId',
      select: 'name examId'
    });
    console.log('UserExam found:', user ? user._id : 'None');
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
        totalMarks: examEntry.totalMarks || 0,
        score: examEntry.score ?? null,
        status: examEntry.status,
        examDate: examEntry.examDate || null,
        answerPaperUrl: examEntry.answerPaperUrl || null
      });
    }
    res.status(200).json({
      message: 'Successfully retrieved applied tests and exams',
      totalApplied: appliedDetails.length,
      data: appliedDetails,
    });
  } catch (error) {
    console.error('Applied tests/exams error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/apply/question-paper/:testId - Get question paper URL for a test
router.get('/question-paper/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    console.log('Get question paper request params:', { testId });
    if (!Test) {
      throw new Error('Test model is undefined');
    }
    const test = await Test.findById(testId).select('name url');
    console.log('Test found:', test ? test._id : 'None');
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    if (!test.url) {
      return res.status(404).json({ error: 'No question paper available for this test' });
    }
    res.status(200).json({
      message: 'Question paper retrieved successfully',
      testName: test.name,
      questionPaperUrl: test.url,
    });
  } catch (error) {
    console.error('Get question paper error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/apply/submit-answer-paper - Submit answer paper PDF
router.post('/submit-answer-paper', upload.single('answerPaper'), async (req, res) => {
  try {
    const { userId, testId } = req.body;
    console.log('Submit answer paper request body:', { userId, testId });
    if (!userId || !testId || !req.file) {
      return res.status(400).json({ error: 'userId, testId, and answerPaper file are required' });
    }
    if (!UserExam) {
      throw new Error('UserExam model is undefined');
    }
    const userExam = await UserExam.findOne({ userId });
    console.log('UserExam found:', userExam ? userExam._id : 'None');
    if (!userExam) {
      return res.status(404).json({ error: 'User exam record not found' });
    }
    if (!Test) {
      throw new Error('Test model is undefined');
    }
    const test = await Test.findById(testId).select('name totalMarks passingMarks');
    console.log('Test found:', test ? test._id : 'None');
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    const examEntry = userExam.examinations.find(
      (exam) => exam.testSeriesId.toString() === testId
    );
    if (!examEntry) {
      return res.status(400).json({ error: 'Test not found in user examinations' });
    }

    // Upload answer paper to Supabase
    const fileName = `answer_${userId}_${testId}_${Date.now()}.pdf`;
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, req.file.buffer, {
        contentType: 'application/pdf',
      });
    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: 'Failed to upload answer paper to Supabase' });
    }
    const answerPaperUrl = `${SUPABASE_URL}/storage/v1/object/public/documents/${fileName}`;
    console.log('Answer paper uploaded:', answerPaperUrl);

    // Update UserExam with answer paper URL and mark as submitted
    examEntry.answerPaperUrl = answerPaperUrl;
    examEntry.status = 'Submitted';
    examEntry.examDate = examEntry.examDate || new Date(); // Only set if not already set
    await userExam.save();

    res.status(200).json({
      message: 'Answer paper submitted successfully',
      answerPaperUrl,
      testName: test.name,
      status: examEntry.status,
    });
  } catch (error) {
    console.error('Submit answer paper error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;