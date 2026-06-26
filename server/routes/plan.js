/* ==========================================================================
   STUDY PLANNER CALENDAR ENDPOINTS (Schedule & checklists)
   ========================================================================== */

const express = require('express');
const router = express.Router();

// 1. Get plans list
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const db = req.db;

  try {
    const result = await db.query(
      'SELECT day_id AS id, day_name AS day, task, completed, subtasks FROM study_plans WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Seed default schedule rows for the user on first load
      const defaultPlans = [
        { id: 'mon', day: 'Thứ 2', task: 'Học từ vựng + Luyện Reading Passage 1', completed: false, subtasks: [] },
        { id: 'tue', day: 'Thứ 3', task: 'Luyện Listening Section 1 & 2', completed: false, subtasks: [] },
        { id: 'wed', day: 'Thứ 4', task: 'Học viết Writing Task 2 (1 bài)', completed: false, subtasks: [] },
        { id: 'thu', day: 'Thứ 5', task: 'Học từ vựng + Luyện Reading Passage 2', completed: false, subtasks: [] },
        { id: 'fri', day: 'Thứ 6', task: 'Luyện Listening Section 3 & 4', completed: false, subtasks: [] },
        { id: 'sat', day: 'Thứ 7', task: 'Làm 1 bài Mock Test hoàn chỉnh', completed: false, subtasks: [] },
        { id: 'sun', day: 'Chủ nhật', task: 'Xem lại và ôn tập Sổ lỗi sai', completed: false, subtasks: [] }
      ];

      for (const p of defaultPlans) {
        await db.query(
          'INSERT INTO study_plans (user_id, day_id, day_name, task, completed, subtasks) VALUES ($1, $2, $3, $4, $5, $6)',
          [userId, p.id, p.day, p.task, p.completed, JSON.stringify(p.subtasks)]
        );
      }

      return res.json(defaultPlans);
    }

    res.json(result.rows);

  } catch (err) {
    console.error('Fetch study plans error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy kế hoạch học tập.' });
  }
});

// 2. Save / Update plan checklist (Upsert)
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const db = req.db;
  const { id, day, task, completed, subtasks } = req.body;

  if (!id || !day) {
    return res.status(400).json({ error: 'Thiếu mã ngày hoặc tên ngày của kế hoạch.' });
  }

  try {
    const queryStr = `
      INSERT INTO study_plans (
        user_id, day_id, day_name, task, completed, subtasks
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, day_id) DO UPDATE SET
        task = EXCLUDED.task,
        completed = EXCLUDED.completed,
        subtasks = EXCLUDED.subtasks
      RETURNING day_id AS id, day_name AS day, task, completed, subtasks
    `;

    const result = await db.query(queryStr, [
      userId, id, day, task || '', completed || false, subtasks ? JSON.stringify(subtasks) : '[]'
    ]);

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Save study plan error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật kế hoạch học tập.' });
  }
});

module.exports = router;
