/* ==========================================================================
   VOCABULARY ENDPOINTS ROUTER (CRUD list manager)
   ========================================================================== */

const express = require('express');
const router = express.Router();

// 1. Get Vocab list
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const db = req.db;

  try {
    const result = await db.query(
      'SELECT id, word, ipa, meaning_vi AS "meaningVi", meaning_en AS "meaningEn", part_of_speech AS "partOfSpeech", example, topic, source, difficulty, status, next_review_date AS "nextReviewDate", created_at AS "createdAt" FROM vocabularies WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch vocab list error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách từ vựng.' });
  }
});

// 2. Save / Update Vocab word (Upsert)
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const db = req.db;
  const { id, word, ipa, meaningVi, meaningEn, partOfSpeech, example, topic, source, difficulty, status, nextReviewDate } = req.body;

  if (!word || !meaningVi) {
    return res.status(400).json({ error: 'Từ vựng và nghĩa tiếng Việt không được để trống.' });
  }

  // Generate ID if missing
  const wordId = id || 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const nextReview = nextReviewDate || new Date().toISOString().split('T')[0];

  try {
    const queryStr = `
      INSERT INTO vocabularies (
        id, user_id, word, ipa, meaning_vi, meaning_en, part_of_speech, example, topic, source, difficulty, status, next_review_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        word = EXCLUDED.word,
        ipa = EXCLUDED.ipa,
        meaning_vi = EXCLUDED.meaning_vi,
        meaning_en = EXCLUDED.meaning_en,
        part_of_speech = EXCLUDED.part_of_speech,
        example = EXCLUDED.example,
        topic = EXCLUDED.topic,
        source = EXCLUDED.source,
        difficulty = EXCLUDED.difficulty,
        status = EXCLUDED.status,
        next_review_date = EXCLUDED.next_review_date
      RETURNING 
        id, word, ipa, meaning_vi AS "meaningVi", meaning_en AS "meaningEn", 
        part_of_speech AS "partOfSpeech", example, topic, source, difficulty, 
        status, next_review_date AS "nextReviewDate"
    `;

    const result = await db.query(queryStr, [
      wordId, userId, word.trim(), ipa ? ipa.trim() : '', meaningVi.trim(), meaningEn ? meaningEn.trim() : '',
      partOfSpeech || 'noun', example ? example.trim() : '', topic || 'General', source ? source.trim() : '',
      difficulty || 'Trung bình', status || 'Chưa thuộc', nextReview
    ]);

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Save vocab word error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lưu từ vựng.' });
  }
});

// 3. Delete Vocab word
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const db = req.db;
  const { id } = req.params;

  try {
    const checkWord = await db.query('SELECT id FROM vocabularies WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkWord.rows.length === 0) {
      return res.status(404).json({ error: 'Từ vựng không tồn tại hoặc bạn không có quyền xóa.' });
    }

    await db.query('DELETE FROM vocabularies WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Xóa từ vựng thành công.' });

  } catch (err) {
    console.error('Delete vocab error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi xóa từ vựng.' });
  }
});

module.exports = router;
