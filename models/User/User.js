const mongoose = require('mongoose');


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
  name: {
    type: String,
  },
  profileImage: { type: String },

  // subjects: [{
  //   type: String,
  // }],
  // batch: {
  //   type: String,
  // },
  // enrollmentDate: {
  //   type: Date,
  //   default: Date.now,
  // },
  // examinations: [ExamResultSchema], // Array of exam results

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
