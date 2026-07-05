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
const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false }
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_DATABASE || 'ielts_hub',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
    };

const dbPool = new Pool(dbConfig);

// Test database connection and auto-initialize tables if missing
dbPool.connect(async (err, client, release) => {
  if (err) {
    console.error('Error acquiring database client from connection pool:', err.stack);
    return;
  }
  
  console.log('PostgreSQL database connected successfully.');
  
  try {
    const res = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);
    
    const tableExists = res.rows[0].exists;
    if (!tableExists) {
      console.log('Database tables not found. Initializing schema.sql...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sqlScript = fs.readFileSync(schemaPath, 'utf8');
        await client.query(sqlScript);
        console.log('✅ Database schema initialized successfully on startup.');
      } else {
        console.warn('⚠️ schema.sql file not found. Could not initialize database.');
      }
    } else {
      console.log('Database tables already exist. Skipping schema initialization.');
    }

    // Clean up duplicate vocabularies (keep only the newest created ID for each unique user/word combo)
    console.log('Checking and cleaning up duplicate vocabularies...');
    const cleanupRes = await client.query(`
      DELETE FROM vocabularies WHERE id NOT IN (
        SELECT MAX(id) FROM vocabularies GROUP BY user_id, LOWER(word)
      )
    `);
    if (cleanupRes.rowCount > 0) {
      console.log(`✅ Cleaned up ${cleanupRes.rowCount} duplicate vocabulary records.`);
    } else {
      console.log('No duplicate vocabulary records found.');
    }

  } catch (schemaErr) {
    console.error('Error during database schema check/initialization:', schemaErr);
  } finally {
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
