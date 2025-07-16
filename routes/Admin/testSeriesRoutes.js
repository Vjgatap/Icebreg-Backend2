const express = require("express");
const router = express.Router();
const Test = require("../../models/Admin/TestSeries");

// POST /api/test-series - Create a new test
router.post("/", async (req, res) => {
  try {
    const {
      name,
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
      name,
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

// // GET /api/test-series - Get all tests
// router.get("/", async (req, res) => {
//   try {
//     const tests = await Test.find()
//       .select("-questions")
//       .populate("categoryId", "name")
//       .populate("examId", "name");
//     res.status(200).json(tests);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });
// GET /api/test-series - Get all tests
router.get("/", async (req, res) => {
  try {
    const tests = await Test.find()
      .select("-questions") // exclude questions field
      .populate("categoryId", "name") // only fetch category name
      .populate({
        path: "examId",
        model: "Exam", // model name should match your exam schema registration
        select: "-__v"  // or select specific fields like 'name duration' if needed
      });

    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/test-series/:testId - Get a specific test by ID
router.get("/:testId", async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await Test.findById(testId)
      // .populate("categoryId", "name")
      // .populate("examId", "name");

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.status(200).json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});// POST /api/test-series/:testId/questions - Add a question to an existing test
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

// GET /api/test-series/:testId/questions - Get all questions from a specific test
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

// GET /api/test-series/:testId/questions/:questionId - Get a specific question
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

// PUT /api/test-series/:id - Update a test
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

// DELETE /api/test-series/:id - Delete a test
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

// PUT /api/test-series/:testId/questions/:questionId - Update a specific question
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

// DELETE /api/test-series/:testId/questions/:questionId - Delete a specific question
router.delete("/:testId/questions/:questionId", async (req, res) => {
  try {
    const { testId, questionId } = req.params;

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    // Find the question to get its marks
    const question = test.questions.id(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    const removedMarks = question.marks;

    // Use pull() to remove the question by ID
    test.questions.pull({ _id: questionId });

    // Update total marks and question count
    test.totalMarks -= removedMarks;
    test.numberOfQuestions = test.questions.length;

    await test.save();

    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


module.exports = router;
