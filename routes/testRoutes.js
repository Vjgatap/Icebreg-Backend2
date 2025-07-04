const express = require("express");
const router = express.Router();
const Test = require("../models/Test");

// Uncomment this code when you want to upload image using cloudinary
// const multer = require("multer");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const cloudinary = require("../utils/cloudinary");


// @route   POST /api/tests
// @desc    Create a new test (without questions)
router.post("/", async (req, res) => {
  try {
    const {
      subject,
      examName,
      numberOfQuestions,
      duration,
      createdDate,
      passingMarks,
      totalMarks,
      description
    } = req.body;

    const newTest = new Test({
      subject,
      examName,
      numberOfQuestions,
      duration,
      createdDate,
      passingMarks,
      totalMarks,
      description
    });

    const savedTest = await newTest.save();
    res.status(201).json(savedTest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/tests
// @desc    Get all tests
router.get("/", async (req, res) => {
  try {
    const tests = await Test.find().select("-questions"); // Exclude questions if you just want test metadata
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/tests/:testId/questions
// @desc    Add a question to an existing test
router.post("/:testId/questions", async (req, res) => {
  try {
    const { testId } = req.params;
    const { question, correctAnswer, options, marks } = req.body;

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: "Test not found" });

    test.questions.push({ question, correctAnswer, options, marks });
    await test.save();

    res.status(200).json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// @route   GET /api/tests/:testId/questions
// @desc    Get all questions from a specific test
router.get("/:testId/questions", async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: "Test not found" });

    res.status(200).json(test.questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/tests/:testId/questions/:questionId
// @desc    Get a specific question from a test by question ID
router.get("/:testId/questions/:questionId", async (req, res) => {
  try {
    const { testId, questionId } = req.params;

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: "Test not found" });

    const question = test.questions.id(questionId);
    if (!question) return res.status(404).json({ error: "Question not found" });

    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/tests/:id - Update a test by MongoDB _id
router.put("/:id", async (req, res) => {
  try {
    const updatedTest = await Test.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedTest) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.json(updatedTest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/tests/:id - Delete a test by MongoDB _id
router.delete("/:id", async (req, res) => {
  try {
    const deletedTest = await Test.findByIdAndDelete(req.params.id);

    if (!deletedTest) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.json({ message: "Test deleted successfully", test: deletedTest });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/tests/:testId/questions/:questionId
router.put("/:testId/questions/:questionId", async (req, res) => {
  try {
    const { testId, questionId } = req.params;
    const updateData = req.body;

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const question = test.questions.id(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    // Update question fields
    question.set(updateData);
    await test.save();

    res.json({ message: "Question updated successfully", question });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// DELETE /api/tests/:testId/questions/:questionId
router.delete("/:testId/questions/:questionId", async (req, res) => {
  try {
    const { testId, questionId } = req.params;

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const questionIndex = test.questions.findIndex(q => q._id.toString() === questionId);
    if (questionIndex === -1) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Remove the question from the array
    test.questions.splice(questionIndex, 1);

    // Optional: update test.totalMarks and numberOfQuestions here

    await test.save();

    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// This code for test papar upload using cloudinary
// Setup multer with Cloudinary storage
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "test_question_images",
//     allowed_formats: ["jpg", "jpeg", "png", "webp"],
//     transformation: [{ width: 800, crop: "limit" }]
//   },
// });

// const upload = multer({ storage });

// // ✅ POST /api/upload/image
// // Uploads image and returns its Cloudinary URL
// router.post("/image", upload.single("file"), (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//     res.status(200).json({
//       message: "Image uploaded successfully",
//       imageUrl: req.file.path, // Cloudinary secure_url
//       public_id: req.file.filename
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });
module.exports = router;
