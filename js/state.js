/* ==========================================================================
   STATE PERSISTENCE & API CONNECTION LAYER (Rest API & Cache client)
   ========================================================================== */

const SERVER_HOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://ielts-a7ws.onrender.com'; // Thay thế bằng URL Backend thật sau khi deploy Render/Railway

const API_BASE = `${SERVER_HOST}/api`;

// In-memory synchronized state cache
const cacheState = {
  user: null,
  vocabularies: [],
  tests: [],
  attempts: [],
  mistakes: [],
  plans: []
};

// --- API Auth headers helper ---
function getAuthHeaders() {
  const token = localStorage.getItem('ielts_jwt_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

// --- Custom Events Dispatcher for Reactivity ---
function dispatchStateEvent(name, detail = {}) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

// --- REST API Client interfaces ---
const AppState = {

  // --- AUTHENTICATION ACTIONS ---
  async register(username, email, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('ielts_jwt_token', data.token);
        cacheState.user = data.user;
        await this.loadAllDataFromServer();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (e) {
      console.error("Registration connection error:", e);
      return { success: false, error: "Không thể kết nối tới máy chủ." };
    }
  },

  async login(username, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('ielts_jwt_token', data.token);
        cacheState.user = data.user;
        await this.loadAllDataFromServer();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (e) {
      console.error("Login connection error:", e);
      return { success: false, error: "Không thể kết nối tới máy chủ." };
    }
  },

  logout() {
    localStorage.removeItem('ielts_jwt_token');
    cacheState.user = null;
    cacheState.vocabularies = [];
    cacheState.attempts = [];
    cacheState.mistakes = [];
    cacheState.plans = [];
    dispatchStateEvent('userStateChange');
    window.location.reload();
  },

  isLoggedIn() {
    return !!localStorage.getItem('ielts_jwt_token');
  },

  // Load cache states on boot
  async loadAllDataFromServer() {
    if (!this.isLoggedIn()) return;

    try {
      // 1. Profile stats
      const profileRes = await fetch(`${API_BASE}/auth/profile`, { headers: getAuthHeaders() });
      if (profileRes.ok) {
        const data = await profileRes.json();
        cacheState.user = data.user;
        dispatchStateEvent('userStateChange', data.user);
      } else if (profileRes.status === 401 || profileRes.status === 403) {
        this.logout();
        return;
      }

      // 2. Vocabularies
      const vocabRes = await fetch(`${API_BASE}/vocab`, { headers: getAuthHeaders() });
      if (vocabRes.ok) {
        cacheState.vocabularies = await vocabRes.json();
        dispatchStateEvent('vocabularyChange', cacheState.vocabularies);
      }

      // 3. Exam attempts
      const attemptsRes = await fetch(`${API_BASE}/exams/attempts`, { headers: getAuthHeaders() });
      if (attemptsRes.ok) {
        cacheState.attempts = await attemptsRes.json();
        dispatchStateEvent('attemptsChange', cacheState.attempts);
      }

      // 4. Mistakes
      const mistakesRes = await fetch(`${API_BASE}/mistakes`, { headers: getAuthHeaders() });
      if (mistakesRes.ok) {
        cacheState.mistakes = await mistakesRes.json();
        dispatchStateEvent('mistakesChange', cacheState.mistakes);
      }

      // 5. Planner
      const plansRes = await fetch(`${API_BASE}/plans`, { headers: getAuthHeaders() });
      if (plansRes.ok) {
        cacheState.plans = await plansRes.json();
        dispatchStateEvent('planChange', cacheState.plans);
      }

      console.log("Cached state database synchronized successfully with server.");

    } catch (err) {
      console.error("Synchronization with API server failed:", err);
    }
  },

  // --- USER PROFILE ---
  getUser() {
    return cacheState.user || {
      username: 'Chưa đăng nhập',
      targetBand: '6.5',
      studyHours: 1.5,
      streak: 0
    };
  },

  saveUser(userData) {
    if (!cacheState.user) return;
    cacheState.user = { ...cacheState.user, ...userData };
    dispatchStateEvent('userStateChange', cacheState.user);

    // Save background remote
    fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    }).catch(e => console.error("Cloud profile save failed:", e));
  },

  updateStreak() {
    // Backend triggers streak update automatically inside profile query logic
    // So we don't need a heavy client logic.
  },

  // --- VOCABULARY NOTEBOOK ---
  getVocabularies() {
    return cacheState.vocabularies;
  },

  saveVocabulary(wordObj) {
    const wordId = wordObj.id || 'v_' + Date.now();
    const formattedWord = {
      id: wordId,
      word: wordObj.word.trim(),
      ipa: wordObj.ipa ? wordObj.ipa.trim() : '',
      meaningVi: wordObj.meaningVi.trim(),
      meaningEn: wordObj.meaningEn ? wordObj.meaningEn.trim() : '',
      partOfSpeech: wordObj.partOfSpeech || 'noun',
      example: wordObj.example ? wordObj.example.trim() : '',
      topic: wordObj.topic || 'General',
      source: wordObj.source ? wordObj.source.trim() : '',
      difficulty: wordObj.difficulty || 'Trung bình',
      status: wordObj.status || 'Chưa thuộc',
      nextReviewDate: wordObj.nextReviewDate || new Date().toISOString().split('T')[0]
    };

    // Optimistic local cache update
    const idx = cacheState.vocabularies.findIndex(v => v.word.toLowerCase() === formattedWord.word.toLowerCase());
    if (idx > -1) {
      cacheState.vocabularies[idx] = { ...cacheState.vocabularies[idx], ...formattedWord };
    } else {
      cacheState.vocabularies.push(formattedWord);
    }
    dispatchStateEvent('vocabularyChange', cacheState.vocabularies);

    // Sync remote background
    fetch(`${API_BASE}/vocab`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(formattedWord)
    }).then(async res => {
      if (res.ok) {
        const saved = await res.json();
        // Overwrite local in-memory id if it was server-generated
        const localIdx = cacheState.vocabularies.findIndex(v => v.word.toLowerCase() === saved.word.toLowerCase());
        if (localIdx > -1) cacheState.vocabularies[localIdx] = saved;
      }
    }).catch(e => console.error("Sync remote vocab failed:", e));

    return formattedWord;
  },

  deleteVocabulary(id) {
    // Local cache update
    cacheState.vocabularies = cacheState.vocabularies.filter(v => v.id !== id);
    dispatchStateEvent('vocabularyChange', cacheState.vocabularies);

    // Sync remote
    fetch(`${API_BASE}/vocab/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).catch(e => console.error("Delete remote vocab failed:", e));
  },

  bulkImportVocabulary(wordList) {
    let imported = 0;
    wordList.forEach(w => {
      const exists = cacheState.vocabularies.some(v => v.word.toLowerCase() === w.word.toLowerCase());
      if (!exists) {
        this.saveVocabulary(w);
        imported++;
      }
    });
    return imported;
  },

  // --- VOCABULARY TESTS ---
  getTests() {
    return cacheState.tests;
  },

  saveTest(testObj) {
    const record = {
      totalQuestions: testObj.totalQuestions,
      correctAnswers: testObj.correctAnswers,
      score: testObj.score,
      testType: testObj.testType || 'Vocabulary Test'
    };

    // Save remote background
    fetch(`${API_BASE}/exams/attempts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        bookTitle: 'Vocabulary Quiz',
        testNumber: 'Vocabulary',
        skill: 'Quiz',
        score: `${testObj.correctAnswers}/${testObj.totalQuestions}`,
        totalCorrect: testObj.correctAnswers,
        timeSpent: 120, // dummy
        notes: JSON.stringify(record)
      })
    }).then(() => this.loadAllDataFromServer())
      .catch(e => console.error("Remote test record failed:", e));

    return record;
  },

  // --- PRACTICE ATTEMPTS (CAMBRIDGE EXAMS) ---
  getAttempts() {
    return cacheState.attempts;
  },

  saveAttempt(attemptObj) {
    const record = {
      bookTitle: attemptObj.bookTitle,
      testNumber: attemptObj.testNumber,
      skill: attemptObj.skill,
      score: attemptObj.score || '0/40',
      totalCorrect: attemptObj.totalCorrect || 0,
      timeSpent: attemptObj.timeSpent || 0,
      userAnswers: attemptObj.userAnswers || {},
      notes: attemptObj.notes || ''
    };

    // Optimistic cache insert
    cacheState.attempts.push({
      ...record,
      completedAt: new Date().toISOString()
    });
    dispatchStateEvent('attemptsChange', cacheState.attempts);

    // Sync remote
    fetch(`${API_BASE}/exams/attempts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(record)
    }).then(() => this.loadAllDataFromServer())
      .catch(e => console.error("Sync remote attempt failed:", e));

    return record;
  },

  // --- MISTAKE NOTEBOOK ---
  getMistakes() {
    return cacheState.mistakes;
  },

  saveMistake(mistakeObj) {
    const id = mistakeObj.id || 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const record = {
      id,
      skill: mistakeObj.skill,
      testTitle: mistakeObj.testTitle,
      questionNumber: mistakeObj.questionNumber,
      userAnswer: mistakeObj.userAnswer,
      correctAnswer: mistakeObj.correctAnswer,
      reason: mistakeObj.reason || 'Chưa phân tích',
      note: mistakeObj.note || ''
    };

    // Optimistic cache update
    const idx = cacheState.mistakes.findIndex(m => m.id === id);
    if (idx > -1) {
      cacheState.mistakes[idx] = { ...cacheState.mistakes[idx], ...record };
    } else {
      cacheState.mistakes.push(record);
    }
    dispatchStateEvent('mistakesChange', cacheState.mistakes);

    // Sync remote
    fetch(`${API_BASE}/mistakes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(record)
    }).catch(e => console.error("Sync remote mistake failed:", e));

    return record;
  },

  deleteMistake(id) {
    cacheState.mistakes = cacheState.mistakes.filter(m => m.id !== id);
    dispatchStateEvent('mistakesChange', cacheState.mistakes);

    fetch(`${API_BASE}/mistakes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).catch(e => console.error("Delete remote mistake failed:", e));
  },

  // --- STUDY PLAN & PLANNER ---
  getPlans() {
    return cacheState.plans;
  },

  savePlan(plansList) {
    cacheState.plans = plansList;
    dispatchStateEvent('planChange', plansList);

    // Sync remote day plans in background
    plansList.forEach(day => {
      fetch(`${API_BASE}/plans`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(day)
      }).catch(e => console.error("Sync plan failed:", e));
    });
  },

  togglePlanTask(id) {
    const plans = this.getPlans();
    const plan = plans.find(p => p.id === id);
    if (plan) {
      plan.completed = !plan.completed;
      this.savePlan(plans);
    }
  },

  // --- SPEAKING VOICE RECORDINGS (MULTER UPLOADER) ---
  async getSpeakingRecords() {
    try {
      const res = await fetch(`${API_BASE}/exams/speaking`, { headers: getAuthHeaders() });
      if (res.ok) {
        const records = await res.json();
        // Prefix audio URL with Server base path
        return records.map(r => ({
          ...r,
          audioUrl: `${SERVER_HOST}${r.filePath}`
        }));
      }
      return [];
    } catch (e) {
      console.error("Fetch speaking records error:", e);
      return [];
    }
  },

  async saveSpeakingRecord(name, audioBlob, duration, notes) {
    const fd = new FormData();
    // Append audio blob file
    fd.append('audioBlob', audioBlob, 'record.webm');
    fd.append('name', name);
    fd.append('duration', duration);
    fd.append('notes', notes || '');

    try {
      const res = await fetch(`${API_BASE}/exams/speaking`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ielts_jwt_token')}`
        },
        body: fd
      });
      return await res.json();
    } catch (e) {
      console.error("Upload speaking file error:", e);
      return { error: 'Không thể upload file ghi âm.' };
    }
  },

  async saveSpeakingNotes(id, notes) {
    try {
      await fetch(`${API_BASE}/exams/speaking/notes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, notes })
      });
    } catch (e) {
      console.error("Save speaking notes error:", e);
    }
  },

  async deleteSpeakingRecord(id) {
    try {
      await fetch(`${API_BASE}/exams/speaking/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (e) {
      console.error("Delete speaking file error:", e);
    }
  },

  // --- DANGER ZONE: WIPE DATA ---
  async resetAllData() {
    this.logout();
  }
};
