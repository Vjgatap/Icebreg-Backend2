const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  options: { type: [String], required: true },
  marks: { type: Number, required: true },
  imageUrl: { type: String } // optional: if image is uploaded via Cloudinary
});

const testSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  examName: { type: String, required: true },
  numberOfQuestions: { type: Number, required: true },
  duration: { type: Number, required: true }, // in minutes
  createdDate: { type: Date, default: Date.now },
  passingMarks: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  description: { type: String },
  url: { type: String },

  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },

  questions: [questionSchema]
});

module.exports = mongoose.model("Test", testSchema);
