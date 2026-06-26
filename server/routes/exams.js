/* ==========================================================================
   EXAM ATTEMPTS & AUDIO RECORDINGS ENDPOINTS (Multer Upload Manager)
   ========================================================================== */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer Storage for user speaking voice recordings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/audio'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `speaking_${Date.now()}_${Math.random().toString(36).substr(2, 5)}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for speaking audios
});

// --- A. TEST ATTEMPTS ENDPOINTS ---

// 1. Get attempts list
router.get('/attempts', async (req, res) => {
  const userId = req.user.id;
  const db = req.db;

  try {
    const result = await db.query(
      'SELECT id, book_title AS "bookTitle", test_number AS "testNumber", skill, score, total_correct AS "totalCorrect", time_spent AS "timeSpent", completed_at AS "completedAt", user_answers AS "userAnswers", notes FROM test_attempts WHERE user_id = $1 ORDER BY completed_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch attempts error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy lịch sử làm bài.' });
  }
});

// 2. Save test attempt score
router.post('/attempts', async (req, res) => {
  const userId = req.user.id;
  const db = req.db;
  const { bookTitle, testNumber, skill, score, totalCorrect, timeSpent, userAnswers, notes } = req.body;

  if (!bookTitle || !testNumber || !skill) {
    return res.status(400).json({ error: 'Thiếu thông tin bộ đề hoặc kỹ năng để lưu kết quả.' });
  }

  const attemptId = 'att_' + Date.now();

  try {
    await db.query(
      'INSERT INTO test_attempts (id, user_id, book_title, test_number, skill, score, total_correct, time_spent, user_answers, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [attemptId, userId, bookTitle, testNumber, skill, score || '0/40', totalCorrect || 0, timeSpent || 0, userAnswers ? JSON.stringify(userAnswers) : '{}', notes || '']
    );
    
    res.status(201).json({ id: attemptId, message: 'Đã lưu lịch sử làm bài thi thành công.' });
  } catch (err) {
    console.error('Save attempt error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lưu kết quả bài thi.' });
  }
});

// --- B. SPEAKING AUDIO RECORDINGS ENDPOINTS ---

// 1. Get speaking files list
router.get('/speaking', async (req, res) => {
  const userId = req.user.id;
  const db = req.db;

  try {
    const result = await db.query(
      'SELECT id, name, file_path AS "filePath", duration, notes, created_at AS "createdAt" FROM speaking_records WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch speaking files error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách file ghi âm.' });
  }
});

// 2. Upload Speaking Voice recording (Multer handler)
router.post('/speaking', upload.single('audioBlob'), async (req, res) => {
  const userId = req.user.id;
  const db = req.db;
  const { name, duration, notes } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Không nhận được file âm thanh nào.' });
  }

  const fileId = 'spk_' + Date.now();
  // Store the relative url path for client media queries e.g. "/uploads/audio/speaking_xxx.webm"
  const relativePath = `/uploads/audio/${req.file.filename}`;

  try {
    const queryStr = `
      INSERT INTO speaking_records (id, user_id, name, file_path, duration, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, file_path AS "filePath", duration, notes, created_at AS "createdAt"
    `;

    const result = await db.query(queryStr, [
      fileId, userId, name || 'Speaking Practice Session', relativePath, duration || '00:00', notes || ''
    ]);

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('Upload speaking record error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lưu trữ file ghi âm.' });
  }
});

// 3. Update comments/notes for a speaking record
router.post('/speaking/notes', async (req, res) => {
  const userId = req.user.id;
  const db = req.db;
  const { id, notes } = req.body;

  try {
    const checkFile = await db.query('SELECT id FROM speaking_records WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkFile.rows.length === 0) {
      return res.status(404).json({ error: 'Bản ghi âm không tồn tại.' });
    }

    await db.query('UPDATE speaking_records SET notes = $1 WHERE id = $2', [notes, id]);
    res.json({ message: 'Cập nhật ghi chú đánh giá thành công.' });
  } catch (err) {
    console.error('Save speaking notes error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lưu ghi chú file ghi âm.' });
  }
});

// 4. Delete speaking file and unlink audio track from server storage
router.delete('/speaking/:id', async (req, res) => {
  const userId = req.user.id;
  const db = req.db;
  const { id } = req.params;

  try {
    const fileRes = await db.query('SELECT file_path FROM speaking_records WHERE id = $1 AND user_id = $2', [id, userId]);
    if (fileRes.rows.length === 0) {
      return res.status(404).json({ error: 'Bản ghi âm không tồn tại hoặc bạn không có quyền xóa.' });
    }

    const relativePath = fileRes.rows[0].file_path;
    // Map relative url back to local server disk path
    const diskPath = path.join(__dirname, '..', relativePath);

    // Delete DB record
    await db.query('DELETE FROM speaking_records WHERE id = $1 AND user_id = $2', [id, userId]);

    // Unlink file from server disk safely
    if (fs.existsSync(diskPath)) {
      fs.unlink(diskPath, (err) => {
        if (err) console.error(`Error unlinking audio file at ${diskPath}:`, err);
        else console.log(`Unlinked deleted audio file: ${diskPath}`);
      });
    }

    res.json({ message: 'Xóa bản ghi âm thành công.' });

  } catch (err) {
    console.error('Delete speaking file error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi xóa file ghi âm.' });
  }
});

module.exports = router;
