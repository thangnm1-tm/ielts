/* ==========================================================================
   VOCABULARY QUIZ ENGINE (Multiple quiz styles)
   ========================================================================== */

const QuizModule = {
  // Config parameters
  vocabList: [],
  questions: [],
  currentIndex: 0,
  correctCount: 0,
  incorrectWords: [],
  timeSpent: 0,
  timerInterval: null,
  
  // Matching type specific states
  matchingSelectedLeft: null,
  matchingSelectedRight: null,
  matchingCurrentPairs: [],

  render(container) {
    this.container = container;
    this.vocabList = AppState.getVocabularies();

    if (this.vocabList.length < 4) {
      this.container.innerHTML = `
        <div class="card" style="max-width:550px;margin:40px auto;text-align:center;padding:32px;">
          <i data-lucide="alert-circle" style="width:48px;height:48px;color:var(--warning);margin:0 auto 16px auto;"></i>
          <h2>Không đủ từ vựng</h2>
          <p style="color:var(--text-secondary);margin:12px 0 24px 0;">Ứng dụng cần ít nhất 4 từ vựng được lưu để tạo bài kiểm tra trắc nghiệm. Hiện tại bạn mới có ${this.vocabList.length} từ.</p>
          <button class="btn btn-primary" onclick="window.location.hash='#vocabulary'">Thêm từ mới ngay</button>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    this.renderQuizSetup();
  },

  // --- 1. SETUP PANEL ---
  renderQuizSetup() {
    this.container.innerHTML = `
      <div class="quiz-setup-grid">
        <div class="card quiz-setup-card">
          <div class="view-header" style="margin-bottom:20px;">
            <div class="view-header-title">
              <h1>Thiết lập bài kiểm tra từ vựng</h1>
              <p>Tạo bài kiểm tra cá nhân hóa để đánh giá mức độ ghi nhớ từ của bạn.</p>
            </div>
          </div>

          <form id="quiz-setup-form">
            <div class="form-grid">
              
              <div class="form-group col-6">
                <label for="quiz-count">Số lượng câu hỏi</label>
                <select id="quiz-count">
                  <option value="5">5 câu hỏi</option>
                  <option value="10" selected>10 câu hỏi</option>
                  <option value="20">20 câu hỏi</option>
                  <option value="30">30 câu hỏi</option>
                </select>
              </div>

              <div class="form-group col-6">
                <label for="quiz-topic">Chủ đề từ vựng</label>
                <select id="quiz-topic">
                  <option value="All" selected>Tất cả chủ đề</option>
                  <option value="Environment">Environment</option>
                  <option value="Education">Education</option>
                  <option value="Technology">Technology</option>
                  <option value="Health">Health</option>
                  <option value="Work">Work</option>
                  <option value="Culture">Culture</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div class="form-group col-6">
                <label for="quiz-difficulty">Độ khó từ</label>
                <select id="quiz-difficulty">
                  <option value="All" selected>Tất cả độ khó</option>
                  <option value="Dễ">Dễ</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Khó">Khó</option>
                </select>
              </div>

              <div class="form-group col-6">
                <label for="quiz-style">Dạng câu hỏi</label>
                <select id="quiz-style">
                  <option value="mix" selected>Trộn hỗn hợp các dạng</option>
                  <option value="mcq_meaning">Trắc nghiệm nghĩa tiếng Việt</option>
                  <option value="mcq_blank">Điền từ vào câu ví dụ</option>
                  <option value="spelling">Viết lại từ tiếng Anh</option>
                  <option value="matching">Ghép từ với nghĩa (3 câu/lượt)</option>
                </select>
              </div>

            </div>

            <div class="form-actions" style="margin-top:32px;">
              <button type="submit" class="btn btn-primary btn-lg" style="width:100%;">
                <i data-lucide="play-circle"></i> Bắt đầu làm bài test
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    lucide.createIcons();

    // Setup Form submission binding
    const form = document.getElementById('quiz-setup-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const count = parseInt(document.getElementById('quiz-count').value);
      const topic = document.getElementById('quiz-topic').value;
      const difficulty = document.getElementById('quiz-difficulty').value;
      const style = document.getElementById('quiz-style').value;

      this.generateQuizQuestions(count, topic, difficulty, style);
    });
  },

  // --- 2. QUESTIONS GENERATOR ---
  generateQuizQuestions(count, topic, difficulty, style) {
    // Filter source words
    let pool = this.vocabList.filter(v => {
      const matchTopic = topic === 'All' || v.topic === topic;
      const matchDiff = difficulty === 'All' || v.difficulty === difficulty;
      return matchTopic && matchDiff;
    });

    if (pool.length < 4) {
      window.showToast(`Chỉ tìm thấy ${pool.length} từ phù hợp tiêu chí. Hệ thống lấy toàn bộ kho từ vựng.`, 'warning');
      pool = [...this.vocabList];
    }

    // Shuffle pool
    pool.sort(() => Math.random() - 0.5);

    // Limit count
    const limit = Math.min(count, pool.length);
    const selectedWords = pool.slice(0, limit);

    this.questions = [];
    let stylesList = ['mcq_meaning', 'mcq_blank', 'spelling', 'matching'];
    if (style !== 'mix') {
      stylesList = [style];
    }

    // Building questions list
    for (let i = 0; i < selectedWords.length; i++) {
      const wordObj = selectedWords[i];
      const selectedStyle = style === 'mix' ? stylesList[Math.floor(Math.random() * stylesList.length)] : style;

      if (selectedStyle === 'matching' && i <= selectedWords.length - 3) {
        // Build a matching set of 3 words
        const pair1 = selectedWords[i];
        const pair2 = selectedWords[i+1];
        const pair3 = selectedWords[i+2];
        i += 2; // skip next 2 iterations
        
        this.questions.push({
          type: 'matching',
          words: [pair1, pair2, pair3],
          answers: [
            { id: pair1.id, word: pair1.word, meaning: pair1.meaningVi },
            { id: pair2.id, word: pair2.word, meaning: pair2.meaningVi },
            { id: pair3.id, word: pair3.word, meaning: pair3.meaningVi }
          ]
        });
      } else if (selectedStyle === 'mcq_blank' && wordObj.example) {
        // MCQ Sentence Gap filling
        const distractors = this.getDistractors(wordObj, pool);
        const options = [wordObj.word, ...distractors].sort(() => Math.random() - 0.5);
        
        // Hide target word in the example sentence
        const regex = new RegExp(`\\b${wordObj.word}\\b`, 'gi');
        const gapText = wordObj.example.replace(regex, '______');

        this.questions.push({
          type: 'mcq_blank',
          wordObj,
          questionText: `Điền từ thích hợp: "${gapText}"`,
          options,
          correctAnswer: wordObj.word
        });
      } else if (selectedStyle === 'spelling') {
        // Spelling/Writing
        this.questions.push({
          type: 'spelling',
          wordObj,
          questionText: `Hãy dịch từ này sang tiếng Anh: "${wordObj.meaningVi}"`
        });
      } else {
        // Default: MCQ Meaning
        const distractors = this.getDistractors(wordObj, pool, true);
        const options = [wordObj.meaningVi, ...distractors].sort(() => Math.random() - 0.5);

        this.questions.push({
          type: 'mcq_meaning',
          wordObj,
          questionText: `Từ "${wordObj.word}" (${wordObj.partOfSpeech}) có nghĩa là gì?`,
          options,
          correctAnswer: wordObj.meaningVi
        });
      }
    }

    // Safeguard: Check if questions got built
    if (this.questions.length === 0) {
      window.showToast('Không thể tạo câu hỏi. Hãy lưu thêm ví dụ cho từ vựng.', 'error');
      return;
    }

    // Reset progress details
    this.currentIndex = 0;
    this.correctCount = 0;
    this.incorrectWords = [];
    this.timeSpent = 0;

    // Start Timer
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timeSpent++;
      this.updateTimerUI();
    }, 1000);

    // Load first question view
    this.renderActiveQuestion();
  },

  getDistractors(correctWord, allWords, isMeaning = false) {
    const list = allWords.filter(w => w.id !== correctWord.id);
    const shuffled = list.sort(() => Math.random() - 0.5);
    const outputs = [];
    
    for (let i = 0; i < shuffled.length && outputs.length < 3; i++) {
      const val = isMeaning ? shuffled[i].meaningVi : shuffled[i].word;
      if (!outputs.includes(val) && val !== (isMeaning ? correctWord.meaningVi : correctWord.word)) {
        outputs.push(val);
      }
    }

    // Static fallback if database has too few distractors
    while (outputs.length < 3) {
      const fallbackItems = isMeaning 
        ? ['bền vững', 'bỏ rơi', 'chính xác', 'bằng chứng', 'nhận thức', 'bước đột phá']
        : ['sustainable', 'abandon', 'accurate', 'evidence', 'cognitive', 'breakthrough'];
      const pick = fallbackItems[Math.floor(Math.random() * fallbackItems.length)];
      if (!outputs.includes(pick) && pick !== (isMeaning ? correctWord.meaningVi : correctWord.word)) {
        outputs.push(pick);
      }
    }

    return outputs;
  },

  updateTimerUI() {
    const el = document.getElementById('quiz-clock');
    if (el) {
      const m = Math.floor(this.timeSpent / 60).toString().padStart(2, '0');
      const s = (this.timeSpent % 60).toString().padStart(2, '0');
      el.textContent = `${m}:${s}`;
    }
  },

  // --- 3. ACTIVE QUESTION RUNNER ---
  renderActiveQuestion() {
    if (this.currentIndex >= this.questions.length) {
      this.finishQuiz();
      return;
    }

    const q = this.questions[this.currentIndex];
    const pct = Math.round((this.currentIndex / this.questions.length) * 100);

    let progressHtml = `
      <div class="quiz-progress">
        <span style="font-size:0.85rem;color:var(--text-secondary);font-weight:600;">
          Câu hỏi ${this.currentIndex + 1} / ${this.questions.length}
        </span>
        <div class="quiz-timer">
          <i data-lucide="clock" style="width:16px;height:16px;"></i>
          <span id="quiz-clock">00:00</span>
        </div>
      </div>
      <div class="progress-bar-container" style="margin-bottom:24px;">
        <div class="progress-bar-fill" style="width:${pct}%;"></div>
      </div>
    `;

    let questionContent = '';

    if (q.type === 'mcq_meaning' || q.type === 'mcq_blank') {
      questionContent = `
        <div class="card question-card-layout">
          ${progressHtml}
          <h3 class="question-text-box">${q.questionText}</h3>
          
          <div class="quiz-options-grid">
            ${q.options.map((opt, idx) => `
              <button class="quiz-option-btn" onclick="QuizModule.handleMCQAnswer('${opt.replace(/'/g, "\\'")}', this)">
                <span>${opt}</span>
                <i data-lucide="circle" class="option-check-icon"></i>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    } else if (q.type === 'spelling') {
      questionContent = `
        <div class="card question-card-layout">
          ${progressHtml}
          <h3 class="question-text-box">${q.questionText}</h3>
          
          <div class="spelling-input-group">
            <input type="text" id="spelling-field-input" placeholder="Nhập từ tiếng Anh..." autofocus autocomplete="off">
          </div>
          
          <button class="btn btn-primary" onclick="QuizModule.handleSpellingAnswer()" style="width:100%;">
            Nộp câu trả lời <i data-lucide="check"></i>
          </button>
        </div>
      `;
    } else if (q.type === 'matching') {
      // Setup random displays
      const leftWords = [...q.words].sort(() => Math.random() - 0.5);
      const rightMeanings = [...q.answers].sort(() => Math.random() - 0.5);
      
      this.matchingSelectedLeft = null;
      this.matchingSelectedRight = null;
      this.matchingCurrentPairs = [];

      questionContent = `
        <div class="card question-card-layout">
          ${progressHtml}
          <h3 class="question-text-box">Ghép cặp từ tiếng Anh với nghĩa tương ứng:</h3>
          
          <div class="matching-lists-container">
            <!-- Left Words -->
            <div class="matching-column" id="match-left-col">
              ${leftWords.map(w => `
                <div class="matching-item" data-id="${w.id}" onclick="QuizModule.selectMatchLeft('${w.id}', this)">
                  ${w.word}
                </div>
              `).join('')}
            </div>
            
            <!-- Right Meanings -->
            <div class="matching-column" id="match-right-col">
              ${rightMeanings.map(m => `
                <div class="matching-item" data-id="${m.id}" onclick="QuizModule.selectMatchRight('${m.id}', this)">
                  ${m.meaning}
                </div>
              `).join('')}
            </div>
          </div>
          
          <button class="btn btn-primary" id="matching-submit-btn" disabled onclick="QuizModule.submitMatchingAnswer()" style="width:100%;">
            Xác nhận ghép cặp <i data-lucide="check"></i>
          </button>
        </div>
      `;
    }

    this.container.innerHTML = questionContent;
    lucide.createIcons();
    this.updateTimerUI(); // sync clock display instantly

    // Bind Enter key for spelling form submission
    if (q.type === 'spelling') {
      const inp = document.getElementById('spelling-field-input');
      inp.focus();
      inp.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          this.handleSpellingAnswer();
        }
      });
    }
  },

  // --- 4. ANSWER EVALUATIONS ---
  handleMCQAnswer(selectedOption, buttonEl) {
    const q = this.questions[this.currentIndex];
    
    // Disable all options
    const btns = document.querySelectorAll('.quiz-option-btn');
    btns.forEach(b => b.style.pointerEvents = 'none');

    const isCorrect = selectedOption === q.correctAnswer;
    
    if (isCorrect) {
      this.correctCount++;
      buttonEl.classList.add('correct');
      buttonEl.querySelector('.option-check-icon').setAttribute('data-lucide', 'check-circle2');
      window.showToast('Đáp án chính xác!', 'success');
    } else {
      this.incorrectWords.push(q.wordObj);
      buttonEl.classList.add('wrong');
      buttonEl.querySelector('.option-check-icon').setAttribute('data-lucide', 'x-circle');
      
      // Highlight correct answer
      btns.forEach(b => {
        if (b.innerText.trim() === q.correctAnswer) {
          b.classList.add('correct');
        }
      });

      // Mark status as review today
      AppState.saveVocabulary({
        ...q.wordObj,
        nextReviewDate: new Date().toISOString().split('T')[0]
      });

      window.showToast(`Sai rồi! Đáp án là: ${q.correctAnswer}`, 'error');
    }

    lucide.createIcons();

    setTimeout(() => {
      this.currentIndex++;
      this.renderActiveQuestion();
    }, 1500);
  },

  handleSpellingAnswer() {
    const q = this.questions[this.currentIndex];
    const inputEl = document.getElementById('spelling-field-input');
    const val = inputEl.value.trim().toLowerCase();

    if (!val) {
      window.showToast('Vui lòng nhập từ vựng trước!', 'warning');
      return;
    }

    // Disable inputs
    inputEl.disabled = true;
    inputEl.style.pointerEvents = 'none';

    const isCorrect = val === q.wordObj.word.toLowerCase().trim();

    if (isCorrect) {
      this.correctCount++;
      inputEl.style.borderColor = 'var(--success)';
      inputEl.style.color = 'var(--success)';
      window.showToast('Chính tả hoàn toàn chính xác!', 'success');
    } else {
      this.incorrectWords.push(q.wordObj);
      inputEl.style.borderColor = 'var(--danger)';
      inputEl.style.color = 'var(--danger)';
      
      // Update schedule to today review pile
      AppState.saveVocabulary({
        ...q.wordObj,
        nextReviewDate: new Date().toISOString().split('T')[0]
      });
      window.showToast(`Chưa đúng! Đáp án đúng: ${q.wordObj.word}`, 'error');
    }

    setTimeout(() => {
      this.currentIndex++;
      this.renderActiveQuestion();
    }, 1800);
  },

  // Matching specific selections
  selectMatchLeft(id, element) {
    // Clear selection
    const items = document.querySelectorAll('#match-left-col .matching-item');
    items.forEach(i => i.classList.remove('selected'));
    
    this.matchingSelectedLeft = { id, el: element };
    element.classList.add('selected');
    this.evaluateMatchSelection();
  },

  selectMatchRight(id, element) {
    const items = document.querySelectorAll('#match-right-col .matching-item');
    items.forEach(i => i.classList.remove('selected'));
    
    this.matchingSelectedRight = { id, el: element };
    element.classList.add('selected');
    this.evaluateMatchSelection();
  },

  evaluateMatchSelection() {
    if (this.matchingSelectedLeft && this.matchingSelectedRight) {
      const leftId = this.matchingSelectedLeft.id;
      const rightId = this.matchingSelectedRight.id;

      // Lock visually as matched pair (even if incorrect temporarily, checked on submit)
      this.matchingCurrentPairs.push({
        leftId,
        rightId,
        leftEl: this.matchingSelectedLeft.el,
        rightEl: this.matchingSelectedRight.el
      });

      this.matchingSelectedLeft.el.classList.add('matched');
      this.matchingSelectedRight.el.classList.add('matched');

      this.matchingSelectedLeft.el.classList.remove('selected');
      this.matchingSelectedRight.el.classList.remove('selected');

      this.matchingSelectedLeft = null;
      this.matchingSelectedRight = null;

      // Enable submit if all pairs matched
      const totalPairs = this.questions[this.currentIndex].words.length;
      if (this.matchingCurrentPairs.length === totalPairs) {
        document.getElementById('matching-submit-btn').removeAttribute('disabled');
      }
    }
  },

  submitMatchingAnswer() {
    const q = this.questions[this.currentIndex];
    let correctCountInMatch = 0;

    this.matchingCurrentPairs.forEach(pair => {
      if (pair.leftId === pair.rightId) {
        correctCountInMatch++;
      } else {
        // Find incorrect word
        const failedWord = q.words.find(w => w.id === pair.leftId);
        if (failedWord) {
          this.incorrectWords.push(failedWord);
          AppState.saveVocabulary({
            ...failedWord,
            nextReviewDate: new Date().toISOString().split('T')[0]
          });
        }
      }
    });

    const isAllCorrect = correctCountInMatch === q.words.length;
    if (isAllCorrect) {
      this.correctCount++;
      window.showToast('Ghép nối chuẩn xác cả 3 cặp từ!', 'success');
    } else {
      window.showToast(`Bạn chỉ ghép đúng ${correctCountInMatch}/${q.words.length} cặp!`, 'warning');
    }

    setTimeout(() => {
      this.currentIndex++;
      this.renderActiveQuestion();
    }, 1500);
  },

  // --- 5. FINISH & RESULTS ---
  finishQuiz() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Save attempt record to storage database
    const scoreVal = Math.round((this.correctCount / this.questions.length) * 100);
    
    const record = AppState.saveTest({
      totalQuestions: this.questions.length,
      correctAnswers: this.correctCount,
      score: scoreVal,
      testType: 'Vocabulary Test'
    });

    // Time calculations
    const min = Math.floor(this.timeSpent / 60);
    const sec = this.timeSpent % 60;

    let resultHtml = `
      <div class="card" style="max-width:650px;margin:30px auto;padding:32px;">
        <div style="text-align:center;margin-bottom:24px;">
          <i data-lucide="award" style="width:56px;height:56px;color:var(--warning);margin:0 auto 12px auto;"></i>
          <h2>Hoàn thành bài kiểm tra!</h2>
          <p style="color:var(--text-muted);margin-top:6px;">Lịch sử đã được tự động lưu.</p>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;text-align:center;">
          <div style="background-color:var(--bg-primary);padding:16px;border-radius:var(--radius-md);border:1px solid var(--border-color)">
            <span style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;">Kết quả</span>
            <h3 style="font-size:1.8rem;font-weight:700;color:var(--primary);margin-top:4px;">
              ${this.correctCount} / ${this.questions.length} đúng
            </h3>
          </div>
          <div style="background-color:var(--bg-primary);padding:16px;border-radius:var(--radius-md);border:1px solid var(--border-color)">
            <span style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;">Thời gian</span>
            <h3 style="font-size:1.8rem;font-weight:700;color:var(--success);margin-top:4px;">
              ${min}p ${sec}s
            </h3>
          </div>
        </div>
    `;

    // Render Review of Errors
    if (this.incorrectWords.length > 0) {
      // Eliminate duplicates
      const uniqueErrors = [];
      const seenIds = new Set();
      this.incorrectWords.forEach(w => {
        if (!seenIds.has(w.id)) {
          seenIds.add(w.id);
          uniqueErrors.push(w);
        }
      });

      resultHtml += `
        <div style="margin-bottom:24px;">
          <h4 style="color:var(--danger);margin-bottom:10px;display:flex;align-items:center;gap:6px;">
            <i data-lucide="alert-triangle" style="width:18px;height:18px;"></i> Từ vựng trả lời sai (${uniqueErrors.length} từ)
          </h4>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:12px;">Các từ này đã được tự động đưa lại vào Sổ cần ôn hôm nay.</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${uniqueErrors.map(w => `
              <span class="badge badge-new" style="cursor:pointer;" onclick="speakWord('${w.word}')" title="Bấm phát âm">
                ${w.word} : ${w.meaningVi}
              </span>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      resultHtml += `
        <div style="text-align:center;color:var(--success);margin-bottom:24px;padding:12px;background-color:rgba(16, 185, 129, 0.05);border-radius:var(--radius-md);border:1px solid rgba(16,185,129,0.15)">
          <strong>🎉 Tuyệt vời!</strong> Bạn đạt điểm tuyệt đối 100% không sai từ nào!
        </div>
      `;
    }

    resultHtml += `
        <div style="display:flex;gap:12px;margin-top:32px;">
          <button class="btn btn-secondary" onclick="window.location.hash='#dashboard'" style="flex-grow:1;">
            Quay về trang chủ
          </button>
          <button class="btn btn-primary" onclick="QuizModule.renderQuizSetup()" style="flex-grow:1;">
            Làm bài test mới
          </button>
        </div>
      </div>
    `;

    this.container.innerHTML = resultHtml;
    lucide.createIcons();
  }
};
