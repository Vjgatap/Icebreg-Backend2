const express = require("express");
const router = express.Router();
const Exam = require("../../models/Admin/Exam");

// Create Exam
router.post("/", async (req, res) => {
  try {
    const exam = new Exam({
      name: req.body.name,
      categoryId: req.body.categoryId
    });
    const saved = await exam.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Exams
router.get("/", async (req, res) => {
  try {
    const exams = await Exam.find().populate("categoryId", "name");
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Exam
router.put("/:id", async (req, res) => {
  try {
    const updated = await Exam.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        categoryId: req.body.categoryId
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Exam not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Exam
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Exam.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Exam not found" });
    res.json({ message: "Exam deleted", exam: deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
