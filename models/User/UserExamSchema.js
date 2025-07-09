const mongoose = require("mongoose");

const ExamResultSchema = new mongoose.Schema({
  testSeriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test",
    required: true
  },
  score: {
    type: Number,
  },
  totalMarks: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Passed', 'Failed', 'Pending', 'Submitted'], // Added 'Submitted' to support answer paper submission
    default: 'Pending',
  },
  examDate: {
    type: Date,
    // Uncommented to support userExam.js logic
  },
  answerPaperUrl: {
    type: String, // Added to store the Supabase URL of the answer paper PDF
  },
}, { _id: false });

const UserExamSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  examinations: [ExamResultSchema],
}, { timestamps: true });

module.exports = mongoose.model("UserExam", UserExamSchema);