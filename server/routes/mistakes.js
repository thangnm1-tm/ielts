/* ==========================================================================
   MISTAKES NOTEBOOK ENDPOINTS (Errors logger & updater)
   ========================================================================== */

const express = require('express');
const router = express.Router();

// 1. Get mistakes list
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const db = req.db;

  try {
    const result = await db.query(
      'SELECT id, skill, test_title AS "testTitle", question_number AS "questionNumber", user_answer AS "userAnswer", correct_answer AS "correctAnswer", reason, note, created_at AS "createdAt" FROM mistakes WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch mistakes error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy sổ lỗi sai.' });
  }
});

// 2. Save / Update mistake reasons & notes (Upsert)
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const db = req.db;
  const { id, skill, testTitle, questionNumber, userAnswer, correctAnswer, reason, note } = req.body;

  if (!skill || !testTitle || !questionNumber || !correctAnswer) {
    return res.status(400).json({ error: 'Thiếu dữ liệu lỗi sai bắt buộc.' });
  }

  const mistakeId = id || 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  try {
    const queryStr = `
      INSERT INTO mistakes (
        id, user_id, skill, test_title, question_number, user_answer, correct_answer, reason, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        reason = EXCLUDED.reason,
        note = EXCLUDED.note
      RETURNING *
    `;

    const result = await db.query(queryStr, [
      mistakeId, userId, skill, testTitle, questionNumber, userAnswer || '', correctAnswer, reason || 'Chưa phân tích', note || ''
    ]);

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Save mistake error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lưu sổ lỗi sai.' });
  }
});

// 3. Delete mistake record
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const db = req.db;
  const { id } = req.params;

  try {
    const checkMistake = await db.query('SELECT id FROM mistakes WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkMistake.rows.length === 0) {
      return res.status(404).json({ error: 'Lỗi sai không tồn tại.' });
    }

    await db.query('DELETE FROM mistakes WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Đã xóa lỗi sai khỏi danh sách.' });

  } catch (err) {
    console.error('Delete mistake error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi xóa lỗi sai.' });
  }
});

module.exports = router;
