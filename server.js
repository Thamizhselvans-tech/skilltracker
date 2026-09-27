const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection check middleware (handles connecting states gracefully during cold boot)
const checkDbConnection = async (req, res, next) => {
  // If connecting (readyState === 2), wait briefly for Atlas handshake to finish
  if (mongoose.connection.readyState === 2) {
    let elapsed = 0;
    while (mongoose.connection.readyState === 2 && elapsed < 8000) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      elapsed += 250;
    }
  }

  // If still not connected (e.g. 0), attempt reconnect
  if (mongoose.connection.readyState !== 1) {
    if (mongoose.connection.readyState === 0 && process.env.MONGO_URI) {
      try {
        await connectDB();
      } catch (err) {
        console.error('[Auto-Reconnect Error]', err.message);
      }
    }
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'MongoDB database is currently establishing cloud connection. Please retry in a few seconds.',
      dbState: mongoose.connection.readyState,
    });
  }
  next();
};

// Health check route
app.get('/', (req, res) => {
  res.json({
    name: 'Skill Tracker API',
    version: '1.0.0',
    status: 'online',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

// Protect data routes with db check
app.use('/api', checkDbConnection);

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/skills', require('./routes/skillRoutes'));
app.use('/api/practice', require('./routes/practiceRoutes'));
app.use('/api/planner', require('./routes/plannerRoutes'));
app.use('/api/timetable', require('./routes/timetableRoutes'));
app.use('/api/internal-exams', require('./routes/internalExamRoutes'));
app.use('/api/external-exams', require('./routes/externalExamRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));
app.use('/api/achievements', require('./routes/achievementRoutes'));

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Skill Tracker Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`[Server] Accessible at http://localhost:${PORT} and on local network`);
});

module.exports = { app, server };
