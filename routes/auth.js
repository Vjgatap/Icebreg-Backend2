const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_URL = process.env.CLERK_API_URL;

// 👉 Signup with Clerk
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
console.log("✅ Clerk URL:", process.env.CLERK_API_URL);

  try {
    // Create user in Clerk
    const clerkRes = await axios.post(`${CLERK_API_URL}/users`, {
      email_address: [email],
      password,
    }, {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const clerkId = clerkRes.data.id;

    // Save user in MongoDB
    const newUser = new User({ clerkId, email, name });
    await newUser.save();

    res.status(201).json({ message: 'Signup successful', clerkId });
  } catch (err) {
    console.error('Signup error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Signup failed', details: err.response?.data });
  }
});

// 👉 Login (Validate Clerk token and fetch user)
router.post('/login', async (req, res) => {
  const { token } = req.body;

  try {
    const clerkRes = await axios.get(`${CLERK_API_URL}/sessions/${token}`, {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      },
    });

    const userId = clerkRes.data.user_id;

    const user = await User.findOne({ clerkId: userId });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'Login successful', user });
  } catch (err) {
    console.error('Login error:', err.response?.data || err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
