const mongoose = require('mongoose');

const ExamResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',         // Reference to the User collection
    required: true
  },
  testSeriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  score: {
    type: Number
  },
  attemptedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Passed', 'Failed', 'Pending'],
    default: 'Pending'
  }
});

module.exports = mongoose.model('ExamResult', ExamResultSchema);
