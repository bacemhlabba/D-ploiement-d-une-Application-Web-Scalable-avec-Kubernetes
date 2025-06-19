import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './lib/db.js';
import authMiddleware from './middleware/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Leave Management API' });
});

// User authentication routes
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Authentication logic would go here
    // This is a placeholder
    res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protected routes example
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const users = await query('SELECT id, username, email, role FROM users');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
