require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const cors = require('cors');
const auth = require('./routes/User/auth');
const adminRoutes = require('./routes/Admin/admin');
const categories = require('./routes/Admin/category');
const exam = require('./routes/Admin/exam');
const testRoutes = require('./routes/Admin/testSeriesRoutes');
const user = require('./routes/Admin/user');
const examResult = require('./routes/Admin/examResult');
const questionpapers = require('./routes/Admin/questionPapers');
const userExam = require('./routes/User/userExam');


// Import routes


// Initialize express
const app = express();

// Middleware
app.use(cors({
  origin: ["https://iceberg2-six.vercel.app", "http://localhost:3000"],
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', auth);
app.use('/api/admin', adminRoutes);

app.use("/api/categories", categories);
app.use("/api/exams", exam);
app.use("/api/test-series", testRoutes);
app.use("/api/user", user);
app.use("/api/examResult", examResult);
app.use("/api/question-papers", questionpapers);
app.use("/api/apply/", userExam);


// Database connection
const db = require('./config/db');
db.connect();

// Routes


// Basic route
app.get('/', (req, res) => {
  res.send('Backend is Connected!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});