const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../../models/User/User');

// GET /api/user/students - Get all students
router.get("/students", async (req, res) => {
  try {
    const students = await User.find(); // You can add filters if needed
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/user/students/list?page=1&limit=10
router.get("/students/list", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 students per page
    const skip = (page - 1) * limit;

    const totalStudents = await User.countDocuments();
    const students = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Optional: sort by newest first

    res.json({
      currentPage: page,
      totalPages: Math.ceil(totalStudents / limit),
      totalStudents,
      students,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/user/:id - Update user by MongoDB _id
router.put("/:id", async (req, res) => {
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

// DELETE /api/user/:id - Delete user by MongoDB _id
router.delete("/:id", async (req, res) => {
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


// GET /api/user/:userId/exams - Get all exam results for a student
router.get("/:userId/exams", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId); // Or use clerkId if needed

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format exam results with percentage and grade
    const formattedExams = user.examinations.map((exam) => {
      const percentage = ((exam.score / exam.totalMarks) * 100).toFixed(2);

      let grade = "F";
      if (percentage >= 90) grade = "A+";
      else if (percentage >= 80) grade = "A";
      else if (percentage >= 70) grade = "B+";
      else if (percentage >= 60) grade = "B";
      else if (percentage >= 50) grade = "C";

      return {
        examName: exam.examName,
        examDate: exam.examDate,
        subject: exam.subject,
        score: exam.score,
        totalMarks: exam.totalMarks,
        percentage: `${percentage}%`,
        grade,
        status: exam.status,
      };
    });

    res.json({
      studentName: user.name,
      studentEmail: user.email,
      studentId: user._id,
      exams: formattedExams,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/user/:userId/exams?examName=...&subject=...
router.get("/:userId/exams", async (req, res) => {
  try {
    const { userId } = req.params;
    const { examName, subject } = req.query;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Search for exam matching both examName and subject
    const exam = user.examinations.find(
      (e) =>
        e.examName.toLowerCase() === examName.toLowerCase() &&
        e.subject.toLowerCase() === subject.toLowerCase()
    );

    if (!exam) {
      return res.status(404).json({ message: "Exam result not found for the given subject and exam name" });
    }

    // Calculate percentage and grade
    const percentage = ((exam.score / exam.totalMarks) * 100).toFixed(2);
    let grade = "F";
    if (percentage >= 90) grade = "A+";
    else if (percentage >= 80) grade = "A";
    else if (percentage >= 70) grade = "B+";
    else if (percentage >= 60) grade = "B";
    else if (percentage >= 50) grade = "C";

    res.json({
      studentName: user.name,
      studentEmail: user.email,
      studentId: user._id,
      course: subject,
      examName: exam.examName,
      examDate: exam.examDate,
      score: exam.score,
      totalMarks: exam.totalMarks,
      percentage: `${percentage}%`,
      grade,
      status: exam.status,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
