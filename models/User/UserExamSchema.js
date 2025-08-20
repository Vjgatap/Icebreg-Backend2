// const mongoose = require("mongoose");

// const ExamAnswerSchema = new mongoose.Schema({
//   questionId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Test.questions", // reference to a question inside Test schema
//     required: true,
//   },
//   answer: {
//     type: String, // the user's selected/typed answer
//     required: true,
//   }
// }, { _id: false });

// const ExamResultSchema = new mongoose.Schema({
//   testSeriesId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Test",
//     required: true
//   },
//   score: {
//     type: Number,
//   },
//   totalMarks: {
//     type: Number,
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ['Passed', 'Failed', 'Pending', 'Submitted'],
//     default: 'Pending',
//   },
//   examDate: {
//     type: Date,
//   },
//   answerPaperUrl: {
//     type: String, // Supabase URL of uploaded PDF if needed
//   },
//   answers: [ExamAnswerSchema] // ✅ store user answers here
// }, { _id: false });

// const UserExamSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//     index: true
//   },
//   examinations: [ExamResultSchema],
// }, { timestamps: true });

// module.exports = mongoose.model("UserExam", UserExamSchema);
const mongoose = require("mongoose");

const ExamAnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test.questions", // reference to a question inside Test schema
    required: true,
  },
  type: {
    type: String,
    enum: ["MCQ", "Descriptive"],
    default: "MCQ",
  },
  answer: {
    type: String, // user selected option OR descriptive text
    required: true,
  },
  score: {
    type: Number, // ✅ store score for descriptive if manually evaluated
    default: 0,
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
    default: 0,
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
    default: Date.now,
  },
  answerPaperUrl: {
    type: String, // Supabase URL of uploaded PDF if needed
  },
  answers: [ExamAnswerSchema],

  // 🔹 Descriptive Stats
  descriptiveTotal: {
    type: Number,
    default: 0,
  },
  descriptiveAttempted: {
    type: Number,
    default: 0,
  },
  descriptiveScore: {
    type: Number,
    default: 0,
  },
  descriptiveNotAttempted: {
    type: Number,
    default: function () {
      return this.descriptiveTotal - this.descriptiveAttempted;
    },
  }
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
