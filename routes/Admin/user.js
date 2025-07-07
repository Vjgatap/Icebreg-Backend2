const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../../models/User/User');
const Test = require('../../models/Admin/TestSeries');

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

module.exports = router;
