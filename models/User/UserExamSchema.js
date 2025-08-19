const mongoose = require("mongoose");

const ExamAnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test.questions", // reference to a question inside Test schema
    required: true,
  },
  answer: {
    type: String, // the user's selected/typed answer
    required: true,
  }
}, { _id: false });

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
    enum: ['Passed', 'Failed', 'Pending', 'Submitted'],
    default: 'Pending',
  },
  examDate: {
    type: Date,
  },
  answerPaperUrl: {
    type: String, // Supabase URL of uploaded PDF if needed
  },
  answers: [ExamAnswerSchema] // ✅ store user answers here
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
