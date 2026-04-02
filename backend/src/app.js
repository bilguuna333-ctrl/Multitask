const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/auth.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const memberRoutes = require('./routes/member.routes');
const invitationRoutes = require('./routes/invitation.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const commentRoutes = require('./routes/comment.routes');
const notificationRoutes = require('./routes/notification.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const submissionRoutes = require('./routes/submission.routes');
const applicationRoutes = require('./routes/application.routes');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Auth-specific stricter rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});
app.use('/api/auth/', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/applications', applicationRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
