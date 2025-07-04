const express = require("express");
const router = express.Router();
const Test = require("../../models/Admin/TestSeries");

// POST /api/tests - Create a new test
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
      description,
      url,
      categoryId,
      examId
    } = req.body;

    const newTest = new Test({
      subject,
      examName,
      numberOfQuestions,
      duration,
      createdDate,
      passingMarks,
      totalMarks,
      description,
      url,
      categoryId,
      examId
    });

    const savedTest = await newTest.save();
    res.status(201).json(savedTest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tests - Get all tests
router.get("/", async (req, res) => {
  try {
    const tests = await Test.find()
      .select("-questions")
      .populate("categoryId", "name")
      .populate("examId", "name");
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tests/:testId/questions - Add a question to an existing test
router.post("/:testId/questions", async (req, res) => {
  try {
    const { testId } = req.params;
    const { question, correctAnswer, options, marks, imageUrl } = req.body;

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: "Test not found" });

    test.questions.push({ question, correctAnswer, options, marks, imageUrl });
    test.totalMarks += marks;
    test.numberOfQuestions = test.questions.length;

    await test.save();
    res.status(200).json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tests/:testId/questions - Get all questions from a specific test
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

// GET /api/tests/:testId/questions/:questionId - Get a specific question
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

// PUT /api/tests/:id - Update a test
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

// DELETE /api/tests/:id - Delete a test
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

// PUT /api/tests/:testId/questions/:questionId - Update a specific question
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

    // Recalculate totalMarks
    test.totalMarks = test.questions.reduce((sum, q) => sum + q.marks, 0);

    await test.save();
    res.json({ message: "Question updated successfully", question });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/tests/:testId/questions/:questionId - Delete a specific question
router.delete("/:testId/questions/:questionId", async (req, res) => {
  try {
    const { testId, questionId } = req.params;

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const question = test.questions.id(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    const removedMarks = question.marks;
    question.remove();

    test.totalMarks -= removedMarks;
    test.numberOfQuestions = test.questions.length;

    await test.save();
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
