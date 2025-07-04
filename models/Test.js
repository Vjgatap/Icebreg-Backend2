const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  options: { type: [String], required: true },
  marks: { type: Number, required: true }
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
  questions: [questionSchema]
});

module.exports = mongoose.model("Test", testSchema);
