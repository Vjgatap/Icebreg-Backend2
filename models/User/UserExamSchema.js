const mongoose = require("mongoose");

const ExamResultSchema = new mongoose.Schema({
//   examDate: {
//     type: Date,
//     required: true,
//   },
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
//   subject: {
//     type: String,
//     required: true,
//   },
  status: {
    type: String,
    enum: ['Passed', 'Failed', 'Pending'],
    default: 'Pending',
  },
}, { _id: false });

const UserExamSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // or mongoose.Schema.Types.ObjectId if you want to reference a User model
    ref:'User',
    required: true,
    index: true
  },
  examinations: [ExamResultSchema],
}, { timestamps: true });

module.exports = mongoose.model("UserExam", UserExamSchema);
