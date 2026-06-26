/* ==========================================================================
   MAIN EXPRESS SERVER API DRIVER
   ========================================================================== */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Ensure audio uploads directory exists
const audioUploadDir = path.join(__dirname, 'uploads/audio');
if (!fs.existsSync(audioUploadDir)) {
  fs.mkdirSync(audioUploadDir, { recursive: true });
  console.log(`Created uploads directory at: ${audioUploadDir}`);
}

// 2. Configure PostgreSQL Connection Pool
const dbPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'ielts_hub',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Test database connection
dbPool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring database client from connection pool:', err.stack);
  } else {
    console.log('PostgreSQL database connected successfully.');
    release();
  }
});

// Make pool accessible globally in req context
app.use((req, res, next) => {
  req.db = dbPool;
  next();
});

// 3. Middlewares
app.use(cors({
  origin: '*', // Allow all client connections for simple local deployment
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded audio files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Chưa cung cấp token đăng nhập. Vui lòng đăng nhập lại.' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_2026_ielts_hub', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
    req.user = user; // user context contains { id, username }
    next();
  });
};

// Expose Auth check middleware globally for router attachments
app.set('authenticateToken', authenticateToken);

// 5. Routers Mounting
const authRouter = require('./routes/auth');
const vocabRouter = require('./routes/vocab');
const examsRouter = require('./routes/exams');
const mistakesRouter = require('./routes/mistakes');
const planRouter = require('./routes/plan');

app.use('/api/auth', authRouter);
app.use('/api/vocab', authenticateToken, vocabRouter);
app.use('/api/exams', authenticateToken, examsRouter);
app.use('/api/mistakes', authenticateToken, mistakesRouter);
app.use('/api/plans', authenticateToken, planRouter);

// Base route checker
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`IELTS Hub backend server listening on port ${PORT}`);
});
