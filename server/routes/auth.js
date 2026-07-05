/* ==========================================================================
   USER AUTHENTICATION ROUTER (Sign Up, Login & Profile stats)
   ========================================================================== */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_2026_ielts_hub';

// 1. User Registration
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const db = req.db;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin đăng ký.' });
  }

  try {
    // Check if username or email already exists
    const checkUser = await db.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Tên đăng nhập hoặc Email đã tồn tại.' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const insertRes = await db.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );
    const newUser = insertRes.rows[0];
    const userId = newUser.id;

    // Pre-seed academic vocabulary for the new user
    const mockVocabs = [
      {
        word: 'sustainable',
        ipa: '/səˈsteɪnəbl/',
        meaning_vi: 'bền vững, thân thiện với môi trường',
        meaning_en: 'Able to be maintained at a certain rate or level, avoiding depletion of natural resources.',
        part_of_speech: 'adjective',
        example: 'Sustainable development is crucial for preserving our environment for future generations.',
        topic: 'Environment',
        source: 'Cambridge 17 - Test 2 Reading',
        difficulty: 'Trung bình',
        status: 'Chưa thuộc'
      },
      {
        word: 'abandon',
        ipa: '/əˈbændən/',
        meaning_vi: 'ruồng bỏ, từ bỏ, hủy bỏ',
        meaning_en: 'Cease to support or look after; give up completely.',
        part_of_speech: 'verb',
        example: 'The company decided to abandon the project due to high maintenance costs.',
        topic: 'General',
        source: 'General Academic Wordlist',
        difficulty: 'Dễ',
        status: 'Chưa thuộc'
      },
      {
        word: 'accurate',
        ipa: '/ˈækjərət/',
        meaning_vi: 'chính xác, đúng đắn',
        meaning_en: 'Correct in all details; exact.',
        part_of_speech: 'adjective',
        example: 'Scientists need accurate measurements to draw correct conclusions.',
        topic: 'Technology',
        source: 'Cambridge 15 - Test 1 Reading',
        difficulty: 'Dễ',
        status: 'Chưa thuộc'
      },
      {
        word: 'acquire',
        ipa: '/əˈkwaɪə(r)/',
        meaning_vi: 'thu nhận được, đạt được',
        meaning_en: 'Buy or obtain an asset or object; learn or develop a skill.',
        part_of_speech: 'verb',
        example: 'Children acquire language naturally through exposure and interaction.',
        topic: 'Education',
        source: 'General Academic Wordlist',
        difficulty: 'Trung bình',
        status: 'Chưa thuộc'
      },
      {
        word: 'evidence',
        ipa: '/ˈevɪdəns/',
        meaning_vi: 'bằng chứng, chứng cứ',
        meaning_en: 'The available body of facts or information indicating whether a belief or proposition is true or valid.',
        part_of_speech: 'noun',
        example: 'There is no scientific evidence to support this claim.',
        topic: 'Science',
        source: 'Cambridge 16 - Test 3 Reading',
        difficulty: 'Trung bình',
        status: 'Chưa thuộc'
      },
      {
        word: 'cognitive',
        ipa: '/ˈkɒɡnətɪv/',
        meaning_vi: 'liên quan đến nhận thức',
        meaning_en: 'Relating to the mental action or process of acquiring knowledge and understanding through thought, experience, and the senses.',
        part_of_speech: 'adjective',
        example: 'Reading books regularly helps improve cognitive abilities.',
        topic: 'Education',
        source: 'General Academic Wordlist',
        difficulty: 'Khó',
        status: 'Chưa thuộc'
      },
      {
        word: 'sufficient',
        ipa: '/səˈfɪʃnt/',
        meaning_vi: 'đủ, có khả năng',
        meaning_en: 'Enough; adequate.',
        part_of_speech: 'adjective',
        example: 'The police did not have sufficient evidence to arrest the suspect.',
        topic: 'General',
        source: 'General Academic Wordlist',
        difficulty: 'Dễ',
        status: 'Chưa thuộc'
      },
      {
        word: 'biodiversity',
        ipa: '/ˌbaɪəʊdaɪˈvɜːsəti/',
        meaning_vi: 'đa dạng sinh học',
        meaning_en: 'The variety of plant and animal life in the world or in a particular habitat.',
        part_of_speech: 'noun',
        example: 'Protecting rainforests is essential for maintaining global biodiversity.',
        topic: 'Environment',
        source: 'Cambridge 17 - Test 1 Reading',
        difficulty: 'Khó',
        status: 'Chưa thuộc'
      }
    ];

    for (const v of mockVocabs) {
      const vId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      await db.query(
        `INSERT INTO vocabularies (id, user_id, word, ipa, meaning_vi, meaning_en, part_of_speech, example, topic, source, difficulty, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [vId, userId, v.word, v.ipa, v.meaning_vi, v.meaning_en, v.part_of_speech, v.example, v.topic, v.source, v.difficulty, v.status]
      );
    }

    // Create Token
    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công.',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        targetBand: '6.5',
        studyHours: 1.5,
        streak: 1
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ trong quá trình đăng ký.' });
  }
});

// 2. User Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const db = req.db;

  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
  }

  try {
    const userRes = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'Tài khoản không tồn tại.' });
    }
    
    const userObj = userRes.rows[0];
    
    // Compare Passwords
    const match = await bcrypt.compare(password, userObj.password);
    if (!match) {
      return res.status(400).json({ error: 'Mật khẩu không chính xác.' });
    }

    // Generate Token
    const token = jwt.sign({ id: userObj.id, username: userObj.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Đăng nhập thành công.',
      token,
      user: {
        id: userObj.id,
        username: userObj.username,
        email: userObj.email,
        targetBand: userObj.target_band,
        studyHours: userObj.study_hours,
        streak: userObj.streak
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ trong quá trình đăng nhập.' });
  }
});

// JWT Verification Middleware for Profile Route
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log("Incoming profile authHeader:", authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log("Authentication failed: No token provided");
    return res.status(401).json({ error: 'Chưa cung cấp token đăng nhập.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("Authentication failed: JWT verify error:", err.message);
      return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
    console.log("Authentication success. Decoded user:", user);
    req.user = user;
    next();
  });
};

// 3. Get User Profile and Aggregated Stats
router.get('/profile', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const db = req.db;

  try {
    const userRes = await db.query('SELECT id, username, email, target_band, study_hours, streak FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Người dùng không tồn tại.' });
    }
    const user = userRes.rows[0];

    // Compute aggregated metrics
    const vocabCountRes = await db.query('SELECT COUNT(*) FROM vocabularies WHERE user_id = $1', [userId]);
    const masteredCountRes = await db.query("SELECT COUNT(*) FROM vocabularies WHERE user_id = $1 AND status = 'Đã thuộc'", [userId]);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const reviewCountRes = await db.query('SELECT COUNT(*) FROM vocabularies WHERE user_id = $1 AND (next_review_date <= $2 OR status = \'Chưa thuộc\')', [userId, todayStr]);
    
    const attemptsCountRes = await db.query('SELECT COUNT(*) FROM test_attempts WHERE user_id = $1', [userId]);
    const mistakesCountRes = await db.query('SELECT COUNT(*) FROM mistakes WHERE user_id = $1', [userId]);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        targetBand: user.target_band,
        studyHours: user.study_hours,
        streak: user.streak
      },
      stats: {
        totalVocab: parseInt(vocabCountRes.rows[0].count),
        masteredVocab: parseInt(masteredCountRes.rows[0].count),
        reviewVocab: parseInt(reviewCountRes.rows[0].count),
        attemptsCount: parseInt(attemptsCountRes.rows[0].count),
        mistakesCount: parseInt(mistakesCountRes.rows[0].count)
      }
    });

  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy dữ liệu profile.' });
  }
});

// 4. Update user profile settings (target band, study hours, username)
router.put('/profile', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const db = req.db;
  const { username, targetBand, studyHours } = req.body;

  try {
    const result = await db.query(
      `UPDATE users SET 
        username = COALESCE($1, username),
        target_band = COALESCE($2, target_band),
        study_hours = COALESCE($3, study_hours)
       WHERE id = $4
       RETURNING id, username, email, target_band AS "targetBand", study_hours AS "studyHours", streak`,
      [username || null, targetBand || null, studyHours || null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Người dùng không tồn tại.' });
    }

    res.json({ message: 'Cập nhật hồ sơ thành công.', user: result.rows[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật hồ sơ.' });
  }
});

module.exports = router;

