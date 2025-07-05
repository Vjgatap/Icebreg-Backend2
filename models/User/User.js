const mongoose = require('mongoose');

// Sub-schema for each exam result
const ExamResultSchema = new mongoose.Schema({
  testSeriesId:{type: String, required: true},
  score: {
    type: Number,
  },
   status: {
    type: String,
    enum: ['Passed', 'Failed', 'Pending'],
    default: 'Pending',
  },
});

const UserSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,

  subjects: [{
    type: String,
  }],
  batch: {
    type: String,
  },
  enrollmentDate: {
    type: Date,
    default: Date.now,
  },
  examinations: [ExamResultSchema], // Array of exam results

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
