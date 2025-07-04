const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
  name: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Exam", examSchema);
