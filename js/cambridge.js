/* ==========================================================================
   CAMBRIDGE PRACTICE EXAM ENGINE (Reading, Listening, Writing, Speaking)
   ========================================================================== */

let examTimer = null;
let examSecondsRemaining = 0;
let isAudioRecording = false;
let audioRecorderInstance = null;
let audioChunks = [];
let speakingTimer = null;

// Popover dictionary tracking
let dictionaryTooltipElement = null;

function removeVocabTooltip() {
  if (dictionaryTooltipElement) {
    dictionaryTooltipElement.remove();
    dictionaryTooltipElement = null;
  }
}

// Global text selection listener for Reading passage dictionary lookup
document.addEventListener('mouseup', (e) => {
  const selection = window.getSelection();
  if (!selection) return;
  
  const text = selection.toString().trim();
  
  // Verify it is inside the reading passage area
  const passageTextEl = e.target.closest('.reading-passage-text');
  if (!passageTextEl) {
    removeVocabTooltip();
    return;
  }

  // Filter single words
  if (text && text.length > 2 && text.length < 30 && !text.includes(' ') && !text.includes('\n')) {
    removeVocabTooltip();
    
    // Create floating tooltip button
    const tooltip = document.createElement('div');
    tooltip.className = 'vocab-tooltip';
    tooltip.innerHTML = `
      <i data-lucide="plus-circle" style="width:14px;height:14px;color:var(--primary)"></i>
      <span>Lưu "${text}"</span>
    `;
    
    // Set position
    tooltip.style.left = `${e.pageX}px`;
    tooltip.style.top = `${e.pageY - 40}px`;
    
    document.body.appendChild(tooltip);
    lucide.createIcons();
    dictionaryTooltipElement = tooltip;
    
    // Bind click to open add vocab word modal
    tooltip.addEventListener('click', (ev) => {
      ev.stopPropagation();
      removeVocabTooltip();
      window.getSelection().removeAllRanges();
      
      // Open modal with word prefilled
      document.getElementById('vocab-id').value = '';
      document.getElementById('vocab-word').value = text;
      document.getElementById('vocab-meaning-vi').value = '';
      document.getElementById('vocab-meaning-en').value = '';
      document.getElementById('vocab-ipa').value = '';
      document.getElementById('vocab-source').value = 'Cambridge Reading Passage';
      window.showModal('word-modal');
    });
  } else {
    removeVocabTooltip();
  }
});

const CambridgeModule = {
  activeBook: null,
  activeTest: null,
  activeSkill: null,

  render(container, queryParams = {}) {
    this.container = container;
    
    // Stop any pending recorders or timers from previous pages
    this.clearGlobalTimers();

    if (queryParams.book && queryParams.test && queryParams.skill) {
      this.activeBook = queryParams.book;
      this.activeTest = queryParams.test;
      this.activeSkill = queryParams.skill;
      
      this.renderExamRoom();
    } else {
      this.renderLibrary();
    }
  },

  clearGlobalTimers() {
    if (examTimer) clearInterval(examTimer);
    if (speakingTimer) clearInterval(speakingTimer);
    if (audioRecorderInstance && isAudioRecording) {
      audioRecorderInstance.stop();
      isAudioRecording = false;
    }
  },

  // --- 1. MOCK LIBRARY VIEWS ---
  renderLibrary() {
    this.container.innerHTML = `
      <div class="vocabulary-layout">
        <div class="view-header">
          <div class="view-header-title">
            <h1>Thư viện đề Cambridge IELTS</h1>
            <p>Luyện tập trực tiếp các đề thi Reading, Listening, Writing, Speaking thực tế.</p>
          </div>
        </div>

        <div class="cambridge-grid">
          ${MockIELTSData.books.map(book => `
            <div class="card book-card">
              <div class="book-cover">
                <i data-lucide="book-open"></i>
              </div>
              <h3 class="book-title">${book.title}</h3>
              <p style="font-size:0.8rem;color:var(--text-secondary);flex-grow:1;">${book.description}</p>
              
              <div class="book-tests-list">
                ${book.tests.map(test => `
                  <div class="test-row-item">
                    <strong>${test.number}</strong>
                    <div class="test-skills-badges">
                      <span class="skill-badge r" onclick="CambridgeModule.startPractice('${book.id}', '${test.number}', 'Reading')" title="Làm bài Reading">R</span>
                      <span class="skill-badge l" onclick="CambridgeModule.startPractice('${book.id}', '${test.number}', 'Listening')" title="Làm bài Listening">L</span>
                      <span class="skill-badge w" onclick="CambridgeModule.startPractice('${book.id}', '${test.number}', 'Writing')" title="Làm bài Writing">W</span>
                      <span class="skill-badge s" onclick="CambridgeModule.startPractice('${book.id}', '${test.number}', 'Speaking')" title="Làm bài Speaking">S</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    lucide.createIcons();
  },

  startPractice(bookId, testNumber, skill) {
    window.location.hash = `#cambridge?book=${bookId}&test=${encodeURIComponent(testNumber)}&skill=${skill}`;
  },

  // --- 2. EXAM ROOM ROUTER ---
  renderExamRoom() {
    const book = MockIELTSData.books.find(b => b.id === this.activeBook);
    const test = book ? book.tests.find(t => t.number === this.activeTest) : null;

    if (!test) {
      window.showToast('Không tìm thấy dữ liệu đề thi!', 'error');
      window.location.hash = '#cambridge';
      return;
    }

    // Render general scaffold
    this.container.innerHTML = `
      <div class="exam-room-header">
        <div>
          <h2 style="font-weight:700;">${book.title} - ${test.number}</h2>
          <span style="font-size:0.85rem;color:var(--text-muted)">Kỹ năng: ${this.activeSkill}</span>
        </div>
        <div style="display:flex;align-items:center;gap:20px;">
          <div class="streak-badge" id="exam-timer-box" style="padding:8px 16px;">
            <i data-lucide="clock"></i>
            <span id="exam-clock">20:00</span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#cambridge'">Thoát</button>
          <button class="btn btn-primary" onclick="CambridgeModule.submitExamAnswers()">Nộp bài</button>
        </div>
      </div>

      <div class="exam-split-layout" id="exam-workspace">
        <!-- Rendered skill dynamic split panels -->
      </div>
    `;
    lucide.createIcons();

    // Start Timer
    if (this.activeSkill === 'Reading') {
      this.startCountdown(20 * 60); // 20 minutes for single Passage
      this.renderReadingRoom(test.reading);
    } else if (this.activeSkill === 'Listening') {
      this.startCountdown(30 * 60); // 30 minutes
      this.renderListeningRoom(test.listening);
    } else if (this.activeSkill === 'Writing') {
      this.startCountdown(40 * 60); // 40 minutes for task 2
      this.renderWritingRoom(test.writing);
    } else if (this.activeSkill === 'Speaking') {
      this.startElapsedTimer(); // Elapsed timer
      this.renderSpeakingRoom(test.speaking);
    }
  },

  startCountdown(seconds) {
    examSecondsRemaining = seconds;
    this.updateClockUI();

    if (examTimer) clearInterval(examTimer);
    examTimer = setInterval(() => {
      examSecondsRemaining--;
      this.updateClockUI();
      if (examSecondsRemaining <= 0) {
        clearInterval(examTimer);
        window.showToast('Hết giờ làm bài! Hệ thống tự động nộp bài.', 'warning');
        this.submitExamAnswers();
      }
    }, 1000);
  },

  startElapsedTimer() {
    examSecondsRemaining = 0;
    this.updateClockUI(true);

    if (examTimer) clearInterval(examTimer);
    examTimer = setInterval(() => {
      examSecondsRemaining++;
      this.updateClockUI(true);
    }, 1000);
  },

  updateClockUI(isElapsed = false) {
    const el = document.getElementById('exam-clock');
    if (!el) return;

    const m = Math.floor(examSecondsRemaining / 60).toString().padStart(2, '0');
    const s = (examSecondsRemaining % 60).toString().padStart(2, '0');
    el.textContent = `${m}:${s}`;
    
    // Add pulsing warning color at last 2 minutes
    if (!isElapsed && examSecondsRemaining < 120) {
      document.getElementById('exam-timer-box').style.color = 'var(--danger)';
      document.getElementById('exam-timer-box').style.borderColor = 'rgba(239, 68, 68, 0.4)';
    }
  },

  // --- 2.1. READING ROOM LAYOUT ---
  renderReadingRoom(readingData) {
    const workspace = document.getElementById('exam-workspace');
    const passage = readingData.passages[0]; // Take Passage 1 mock

    workspace.innerHTML = `
      <!-- Left Passage Panel -->
      <div class="exam-panel">
        <div class="panel-header">
          <h3>Passage 1: ${passage.title}</h3>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-outline btn-sm" onclick="CambridgeModule.changeTextSize(-1)" title="Thu nhỏ chữ">A-</button>
            <button class="btn btn-outline btn-sm" onclick="CambridgeModule.changeTextSize(1)" title="Phóng to chữ">A+</button>
          </div>
        </div>
        <div class="panel-scrollable highlightable" id="passage-content-area" style="font-size:16px;">
          <div class="reading-passage-text">
            ${passage.content}
          </div>
        </div>
      </div>

      <!-- Right Questions Answer Sheet -->
      <div class="exam-panel">
        <div class="panel-header">
          <h3>Tờ đáp án (Answer Sheet)</h3>
        </div>
        <div class="panel-scrollable">
          <form id="reading-answers-form">
            ${passage.questions.map((group, gIdx) => `
              <div class="question-group">
                <h4>${group.instruction}</h4>
                
                ${group.items.map(item => {
                  if (group.type === 'y_n_ng') {
                    // True/False/Not Given dropdown select
                    return `
                      <div class="exam-input-row">
                        <span class="exam-input-num">${item.num}.</span>
                        <span style="flex-grow:1;font-size:0.9rem;">${item.text}</span>
                        <select class="filter-select user-exam-input" data-num="${item.num}" style="width:140px;padding:6px 10px;">
                          <option value="">-- Chọn --</option>
                          <option value="TRUE">TRUE</option>
                          <option value="FALSE">FALSE</option>
                          <option value="NOT GIVEN">NOT GIVEN</option>
                        </select>
                      </div>
                    `;
                  } else if (group.type === 'mcq') {
                    // Multiple Choice selections dropdown
                    return `
                      <div class="exam-input-row" style="flex-direction:column;align-items:start;gap:6px;">
                        <div style="display:flex;gap:12px;">
                          <span class="exam-input-num">${item.num}.</span>
                          <span style="font-weight:600;font-size:0.9rem;">${item.text}</span>
                        </div>
                        <div style="margin-left:36px;width:100%;">
                          ${item.options.map(opt => `
                            <label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:0.85rem;cursor:pointer;">
                              <input type="radio" name="radio-q-${item.num}" class="user-exam-input" data-num="${item.num}" value="${opt.charAt(0)}">
                              <span>${opt}</span>
                            </label>
                          `).join('')}
                        </div>
                      </div>
                    `;
                  } else {
                    // Standard Gap filling input field
                    return `
                      <div class="exam-input-row">
                        <span class="exam-input-num">${item.num}.</span>
                        <span style="font-size:0.9rem;margin-right:8px;">${item.text}</span>
                        <input type="text" class="exam-text-input user-exam-input" data-num="${item.num}" placeholder="Nhập đáp án...">
                      </div>
                    `;
                  }
                }).join('')}
              </div>
            `).join('')}
          </form>
        </div>
      </div>
    `;

    lucide.createIcons();
  },

  changeTextSize(delta) {
    const el = document.getElementById('passage-content-area');
    if (el) {
      const currentSize = parseInt(window.getComputedStyle(el).fontSize);
      el.style.fontSize = `${currentSize + delta}px`;
    }
  },

  // --- 2.2. LISTENING ROOM LAYOUT ---
  renderListeningRoom(listeningData) {
    const workspace = document.getElementById('exam-workspace');
    
    workspace.innerHTML = `
      <!-- Left Audio Player & Transcript Panel -->
      <div class="exam-panel">
        <div class="panel-header">
          <h3>Listening Audio Player</h3>
        </div>
        <div class="panel-scrollable">
          
          <!-- Custom Audio Controller -->
          <div class="listening-audio-widget">
            <audio id="listening-audio-file" src="${listeningData.audioUrl}"></audio>
            
            <button class="audio-ctrl-btn" id="audio-play-pause-btn" onclick="CambridgeModule.toggleAudioPlay()">
              <i data-lucide="play" id="audio-play-icon"></i>
            </button>
            
            <div class="audio-progress-bar" id="audio-scrub-bar" onclick="CambridgeModule.scrubAudio(event)">
              <div class="audio-progress-fill" id="audio-fill-progress"></div>
            </div>

            <div style="font-size:0.75rem;color:var(--text-muted);" id="audio-time-label">0:00 / 0:00</div>
            
            <select class="audio-speed-select" id="audio-speed-select" onchange="CambridgeModule.changeAudioSpeed(this.value)">
              <option value="0.75">0.75x</option>
              <option value="1.0" selected>1.0x</option>
              <option value="1.25">1.25x</option>
            </select>
          </div>

          <!-- Transcript container revealed after submit -->
          <div class="transcript-toggle-box" id="listening-transcript-box" style="display:none;">
            <div class="card" style="background-color:var(--bg-primary);border-color:var(--success)">
              <h4 style="color:var(--success);margin-bottom:12px;display:flex;align-items:center;gap:6px;">
                <i data-lucide="file-text"></i> Audio Transcript & Key Answers
              </h4>
              <div style="font-size:0.9rem;line-height:1.6;color:var(--text-secondary);max-height:300px;overflow-y:auto;" class="reading-passage-text">
                ${listeningData.transcript}
              </div>
            </div>
          </div>
          
        </div>
      </div>

      <!-- Right Answers Sheet -->
      <div class="exam-panel">
        <div class="panel-header">
          <h3>Tờ đáp án (Answer Sheet)</h3>
        </div>
        <div class="panel-scrollable">
          <form id="listening-answers-form">
            ${listeningData.questions.map((section, sIdx) => `
              <div class="question-group">
                <h4>Section ${section.section}: ${section.instruction}</h4>
                
                ${section.items.map(item => `
                  <div class="exam-input-row" style="align-items:start;flex-direction:column;gap:6px;">
                    <div style="display:flex;align-items:center;width:100%;">
                      <span class="exam-input-num">${item.num}.</span>
                      <span style="font-weight:600;font-size:0.85rem;margin-right:8px;color:var(--text-muted)">${item.label}</span>
                      <input type="text" class="exam-text-input user-exam-input" data-num="${item.num}" placeholder="Nhập đáp án...">
                    </div>
                    <span style="font-size:0.8rem;color:var(--text-secondary);margin-left:36px;">"${item.text}"</span>
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </form>
        </div>
      </div>
    `;

    lucide.createIcons();

    // Bind Native HTML5 Audio Listeners
    setTimeout(() => {
      const audio = document.getElementById('listening-audio-file');
      if (audio) {
        audio.addEventListener('timeupdate', this.onAudioTimeUpdate);
        audio.addEventListener('loadedmetadata', this.onAudioTimeUpdate);
        audio.addEventListener('ended', () => {
          document.getElementById('audio-play-icon').setAttribute('data-lucide', 'play');
          lucide.createIcons();
        });
      }
    }, 200);
  },

  toggleAudioPlay() {
    const audio = document.getElementById('listening-audio-file');
    const icon = document.getElementById('audio-play-icon');
    if (!audio || !icon) return;

    if (audio.paused) {
      audio.play();
      icon.setAttribute('data-lucide', 'pause');
    } else {
      audio.pause();
      icon.setAttribute('data-lucide', 'play');
    }
    lucide.createIcons();
  },

  scrubAudio(e) {
    const audio = document.getElementById('listening-audio-file');
    const bar = document.getElementById('audio-scrub-bar');
    if (!audio || !bar) return;

    const rect = bar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
  },

  onAudioTimeUpdate() {
    const audio = document.getElementById('listening-audio-file');
    const fill = document.getElementById('audio-fill-progress');
    const label = document.getElementById('audio-time-label');
    if (!audio || !fill || !label) return;

    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    fill.style.width = `${pct}%`;

    const curM = Math.floor(audio.currentTime / 60);
    const curS = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
    const durM = Math.floor(audio.duration / 60) || 0;
    const durS = Math.floor(audio.duration % 60 || 0).toString().padStart(2, '0');

    label.textContent = `${curM}:${curS} / ${durM}:${durS}`;
  },

  changeAudioSpeed(val) {
    const audio = document.getElementById('listening-audio-file');
    if (audio) audio.playbackRate = parseFloat(val);
  },

  // --- 2.3. WRITING ROOM LAYOUT ---
  renderWritingRoom(writingData) {
    const workspace = document.getElementById('exam-workspace');
    const task = writingData.tasks.find(t => t.number === 'Task 2') || writingData.tasks[0];

    workspace.innerHTML = `
      <!-- Left Prompt Panel -->
      <div class="exam-panel">
        <div class="panel-header">
          <h3>Writing ${task.number} Prompt</h3>
        </div>
        <div class="panel-scrollable">
          <div class="speaking-prompt-box">
            <h3 style="margin-bottom:12px;font-weight:700;">Đề bài:</h3>
            <p style="font-size:1.05rem;line-height:1.6;font-family:var(--font-heading);font-style:italic;">"${task.prompt}"</p>
          </div>
          <p style="font-size:0.85rem;color:var(--text-muted);"><i data-lucide="info" style="width:14px;height:14px;"></i> ${task.tips}</p>
        </div>
      </div>

      <!-- Right Text Area Panel -->
      <div class="exam-panel">
        <div class="panel-header">
          <h3>Bài viết của bạn</h3>
        </div>
        <div class="panel-scrollable writing-layout">
          <textarea class="writing-textarea" id="writing-input-textarea" placeholder="Nhập bài viết Writing của bạn vào đây..." oninput="CambridgeModule.updateWordCount()"></textarea>
          
          <div class="writing-meta-row">
            <span id="writing-word-count">Số từ: 0 từ</span>
            <span style="color:var(--text-muted)">Yêu cầu tối thiểu: 250 từ</span>
          </div>

          <!-- Criteria Checklist -->
          <div class="criteria-checklist">
            <h4 style="margin-bottom:8px;font-size:0.9rem;">Tiêu chí chấm điểm IELTS Checklist:</h4>
            <div class="criteria-item">
              <input type="checkbox" id="crit-response">
              <label for="crit-response"><strong>Task Response:</strong> Trả lời trực tiếp và bao quát mọi phần của câu hỏi đề bài.</label>
            </div>
            <div class="criteria-item">
              <input type="checkbox" id="crit-cc">
              <label for="crit-cc"><strong>Coherence & Cohesion:</strong> Bố cục bài rõ ràng (Mở, Thân, Kết), sử dụng liên từ mạch lạc.</label>
            </div>
            <div class="criteria-item">
              <input type="checkbox" id="crit-lexical">
              <label for="crit-lexical"><strong>Lexical Resource:</strong> Sử dụng từ vựng đa dạng, phong phú chủ đề, tránh lặp từ.</label>
            </div>
            <div class="criteria-item">
              <input type="checkbox" id="crit-grammar">
              <label for="crit-grammar"><strong>Grammar Accuracy:</strong> Viết đúng ngữ pháp, sử dụng xen kẽ câu đơn và câu phức hợp.</label>
            </div>
          </div>
        </div>
      </div>
    `;

    lucide.createIcons();
  },

  updateWordCount() {
    const text = document.getElementById('writing-input-textarea').value.trim();
    const count = text ? text.split(/\s+/).length : 0;
    document.getElementById('writing-word-count').textContent = `Số từ: ${count} từ`;
  },

  // --- 2.4. SPEAKING ROOM LAYOUT ---
  renderSpeakingRoom(speakingData) {
    const workspace = document.getElementById('exam-workspace');
    const card = speakingData.parts.find(p => p.number.includes('Part 2')) || speakingData.parts[0];

    workspace.innerHTML = `
      <!-- Left Speaking Prompt Card -->
      <div class="exam-panel">
        <div class="panel-header">
          <h3>Speaking ${card.number}</h3>
        </div>
        <div class="panel-scrollable">
          <div class="speaking-prompt-box">
            <h3 style="color:var(--primary);margin-bottom:8px;">Chủ đề phát biểu:</h3>
            <h4 style="font-size:1.15rem;margin-bottom:12px;font-weight:700;">${card.topic}</h4>
            <p style="font-size:0.85rem;color:var(--text-secondary)">Bạn nên trình bày về:</p>
            <ul class="speaking-bullets">
              ${card.points.map(p => `<li style="font-size:0.9rem;color:var(--text-secondary);">${p}</li>`).join('')}
            </ul>
          </div>
          <div style="display:flex;gap:12px;margin-bottom:20px;">
            <div style="background-color:rgba(99,102,241,0.05);padding:10px 14px;border-radius:var(--radius-sm);border:1px solid var(--border-color);font-size:0.8rem;flex-grow:1;text-align:center;">
              <strong>Thời gian chuẩn bị:</strong> ${card.prepareTime}
            </div>
            <div style="background-color:rgba(16,185,129,0.05);padding:10px 14px;border-radius:var(--radius-sm);border:1px solid var(--border-color);font-size:0.8rem;flex-grow:1;text-align:center;">
              <strong>Thời gian phát biểu:</strong> ${card.talkTime}
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <button class="btn btn-outline" onclick="CambridgeModule.startCueCardPreparationTimer(60)">
              Bắt đầu 1 phút chuẩn bị
            </button>
            <button class="btn btn-outline" onclick="CambridgeModule.startCueCardPreparationTimer(120)">
              Bắt đầu 2 phút nói
            </button>
          </div>
        </div>
      </div>

      <!-- Right Audio Recording Interface Panel -->
      <div class="exam-panel">
        <div class="panel-header">
          <h3>Ghi âm bài nói và nhận xét</h3>
        </div>
        <div class="panel-scrollable" style="display:flex;flex-direction:column;gap:20px;">
          
          <div class="recorder-interface">
            <div class="recorder-ring" id="voice-recorder-btn" onclick="CambridgeModule.toggleVoiceRecording()">
              <i data-lucide="mic" id="voice-mic-icon"></i>
            </div>
            <div id="recorder-status" style="font-weight:600;font-size:0.95rem;color:var(--text-muted)">Bấm nút Mic để bắt đầu ghi âm</div>
            
            <!-- Record time duration counter -->
            <div id="record-duration-timer" style="font-weight:700;font-size:1.2rem;display:none;color:var(--danger)">00:00</div>
          </div>

          <!-- Speech Records list for current test -->
          <div style="border-top:1px solid var(--border-color);padding-top:16px;">
            <h4 style="margin-bottom:12px;">Bản ghi âm bài nói của bạn:</h4>
            <div id="speaking-records-list">
              <!-- Dynamically populated from IndexedDB -->
            </div>
          </div>

        </div>
      </div>
    `;

    lucide.createIcons();
    this.loadSpeakingAudioRecords();
  },

  startCueCardPreparationTimer(seconds) {
    examSecondsRemaining = seconds;
    this.updateClockUI();
    window.showToast(`Bắt đầu bấm giờ: ${seconds} giây!`, 'info');

    if (examTimer) clearInterval(examTimer);
    examTimer = setInterval(() => {
      examSecondsRemaining--;
      this.updateClockUI();
      if (examSecondsRemaining <= 0) {
        clearInterval(examTimer);
        speakWord('Time is up.'); // Verbal warning using Speech TTS
        window.showToast('Hết thời gian chuẩn bị/phát biểu!', 'warning');
      }
    }, 1000);
  },

  async toggleVoiceRecording() {
    const btn = document.getElementById('voice-recorder-btn');
    const statusText = document.getElementById('recorder-status');
    const timerLabel = document.getElementById('record-duration-timer');
    const micIcon = document.getElementById('voice-mic-icon');
    if (!btn || !statusText) return;

    if (!isAudioRecording) {
      // Start Recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        
        audioRecorderInstance = new MediaRecorder(stream);
        audioRecorderInstance.addEventListener('dataavailable', e => {
          if (e.data.size > 0) audioChunks.push(e.data);
        });

        audioRecorderInstance.addEventListener('stop', async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const durationVal = timerLabel.textContent;
          
          // Save to IndexedDB
          const recordName = `${this.activeTest} ${this.activeSkill} Recording`;
          await AppState.saveSpeakingRecord(recordName, audioBlob, durationVal, '');
          
          window.showToast('Đã lưu file ghi âm bài phát biểu!');
          this.loadSpeakingAudioRecords();

          // Free mic stream track resources
          stream.getTracks().forEach(track => track.stop());
        });

        audioRecorderInstance.start();
        isAudioRecording = true;
        
        btn.classList.add('recording');
        statusText.textContent = 'Đang ghi âm bài nói của bạn...';
        statusText.style.color = 'var(--danger)';
        timerLabel.style.display = 'block';
        micIcon.setAttribute('data-lucide', 'square');
        lucide.createIcons();

        // Start record elapsed time
        let elapsed = 0;
        timerLabel.textContent = '00:00';
        if (speakingTimer) clearInterval(speakingTimer);
        speakingTimer = setInterval(() => {
          elapsed++;
          const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
          const s = (elapsed % 60).toString().padStart(2, '0');
          timerLabel.textContent = `${m}:${s}`;
        }, 1000);

      } catch (err) {
        console.error('Mic access denied:', err);
        window.showToast('Không thể truy cập Microphone! Vui lòng cho phép quyền truy cập mic.', 'error');
      }
    } else {
      // Stop Recording
      if (audioRecorderInstance) {
        audioRecorderInstance.stop();
      }
      isAudioRecording = false;
      if (speakingTimer) clearInterval(speakingTimer);

      btn.classList.remove('recording');
      statusText.textContent = 'Bấm nút Mic để bắt đầu ghi âm';
      statusText.style.color = 'var(--text-muted)';
      timerLabel.style.display = 'none';
      micIcon.setAttribute('data-lucide', 'mic');
      lucide.createIcons();
    }
  },

  async loadSpeakingAudioRecords() {
    const container = document.getElementById('speaking-records-list');
    if (!container) return;

    const list = await AppState.getSpeakingRecords();
    // Filter records for this test specifically
    const matched = list.filter(r => r.name.startsWith(this.activeTest));

    if (matched.length === 0) {
      container.innerHTML = `<p style="font-size:0.8rem;color:var(--text-muted);text-align:center;padding:12px;">Chưa có bản ghi âm nào cho đề thi này.</p>`;
      return;
    }

    container.innerHTML = matched.map(rec => {
      const audioUrl = URL.createObjectURL(rec.audioBlob);
      return `
        <div class="card" style="padding:16px;background-color:var(--bg-primary);margin-bottom:12px;">
          <div style="display:flex;justify-content:between;align-items:center;margin-bottom:10px;">
            <strong style="font-size:0.85rem">${rec.date} • Dài: ${rec.duration}</strong>
            <button class="btn btn-outline btn-sm" onclick="CambridgeModule.deleteSpeakingAudio('${rec.id}')" style="padding:4px 8px;color:var(--danger)">Xóa</button>
          </div>
          <audio class="speaking-audio-player" controls src="${audioUrl}"></audio>
          
          <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px;">
            <label style="font-size:0.75rem;color:var(--text-muted)">Ghi chú đánh giá cá nhân:</label>
            <input type="text" class="exam-text-input" value="${rec.notes || ''}" placeholder="Nhập lỗi phát âm, từ vựng hoặc điểm cần cải thiện..." onchange="CambridgeModule.saveSpeakingNotes('${rec.id}', this.value)">
          </div>
        </div>
      `;
    }).join('');
  },

  async saveSpeakingNotes(id, notes) {
    const list = await AppState.getSpeakingRecords();
    const record = list.find(r => r.id === id);
    if (record) {
      await saveAudioRecord(record.id, record.name, record.audioBlob, record.date, record.duration, notes);
      window.showToast('Đã lưu nhận xét đánh giá!');
    }
  },

  async deleteSpeakingAudio(id) {
    if (confirm('Bạn muốn xóa bản ghi âm này?')) {
      await AppState.deleteSpeakingRecord(id);
      window.showToast('Đã xóa ghi âm.', 'error');
      this.loadSpeakingAudioRecords();
    }
  },

  // --- 3. EXAM ANSWERS SUBMISSIONS ---
  submitExamAnswers() {
    const book = MockIELTSData.books.find(b => b.id === this.activeBook);
    const test = book ? book.tests.find(t => t.number === this.activeTest) : null;

    if (!test) return;

    // Clear background timers
    this.clearGlobalTimers();

    if (this.activeSkill === 'Writing') {
      // Save essay text to attempts
      const essay = document.getElementById('writing-input-textarea').value.trim();
      if (!essay) {
        window.showToast('Vui lòng viết bài luận trước khi nộp!', 'warning');
        return;
      }
      
      AppState.saveAttempt({
        bookTitle: book.title,
        testNumber: test.number,
        skill: 'Writing',
        score: 'Nộp bài',
        totalCorrect: 0,
        timeSpent: (40 * 60) - examSecondsRemaining,
        notes: essay
      });

      window.showToast('Nộp bài viết Writing thành công! Điểm lịch sử đã được lưu.');
      setTimeout(() => window.location.hash = '#dashboard', 1500);
      return;
    }

    if (this.activeSkill === 'Speaking') {
      // speaking records are saved instantly, just log overall attempt record
      AppState.saveAttempt({
        bookTitle: book.title,
        testNumber: test.number,
        skill: 'Speaking',
        score: 'Đã hoàn thành',
        totalCorrect: 0,
        timeSpent: examSecondsRemaining
      });
      window.showToast('Đã lưu phiên luyện nói thành công!');
      setTimeout(() => window.location.hash = '#dashboard', 1500);
      return;
    }

    // Evaluate Reading or Listening Answers
    const answersForm = document.getElementById(this.activeSkill === 'Reading' ? 'reading-answers-form' : 'listening-answers-form');
    const inputs = answersForm.querySelectorAll('.user-exam-input');
    
    const userAnswersMap = {};
    let correctCount = 0;
    const errorsList = [];

    // Reference answers dataset
    const referenceQuestions = this.activeSkill === 'Reading' 
      ? test.reading.passages[0].questions
      : test.listening.questions;

    // Compile answers key
    const refAnswersMap = {};
    referenceQuestions.forEach(group => {
      group.items.forEach(item => {
        refAnswersMap[item.num] = item.answer.toLowerCase().trim();
      });
    });

    // Score user submissions
    inputs.forEach(input => {
      const qNum = parseInt(input.getAttribute('data-num'));
      let rawVal = '';

      if (input.type === 'radio') {
        if (input.checked) {
          rawVal = input.value.toLowerCase().trim();
          userAnswersMap[qNum] = rawVal;
        }
      } else {
        rawVal = input.value.toLowerCase().trim();
        userAnswersMap[qNum] = rawVal;
      }
    });

    // Check answers correctly (including un-answered questions)
    Object.keys(refAnswersMap).forEach(numStr => {
      const num = parseInt(numStr);
      const userVal = userAnswersMap[num] || '';
      const refVal = refAnswersMap[num];

      if (userVal === refVal) {
        correctCount++;
      } else {
        // Log incorrect answer to Mistake Notebook
        errorsList.push({
          num,
          userAnswer: userVal.toUpperCase() || 'Không trả lời',
          correctAnswer: refVal.toUpperCase()
        });
      }
    });

    // Calculate score
    const totalQuestions = Object.keys(refAnswersMap).length;
    const scoreVal = `${correctCount}/${totalQuestions}`;

    // Save exam attempt
    const attempt = AppState.saveAttempt({
      bookTitle: book.title,
      testNumber: test.number,
      skill: this.activeSkill,
      score: scoreVal,
      totalCorrect: correctCount,
      timeSpent: this.activeSkill === 'Reading' ? (20 * 60) - examSecondsRemaining : (30 * 60) - examSecondsRemaining,
      userAnswers: userAnswersMap
    });

    // Push errors to Mistake Database
    errorsList.forEach(err => {
      AppState.saveMistake({
        skill: this.activeSkill,
        testTitle: `${book.title} - ${test.number}`,
        questionNumber: err.num,
        userAnswer: err.userAnswer,
        correctAnswer: err.correctAnswer,
        reason: 'Chưa phân tích',
        note: ''
      });
    });

    // Reveal transcript with correct choices highlighted (specifically for Listening)
    if (this.activeSkill === 'Listening') {
      const transBox = document.getElementById('listening-transcript-box');
      if (transBox) transBox.style.display = 'block';
    }

    // Display scorecard details
    this.renderResultPopup(correctCount, totalQuestions, errorsList);
  },

  renderResultPopup(correct, total, errors) {
    // Show pop-up result panel
    const root = this.container;
    const min = Math.floor(examSecondsRemaining / 60);

    let html = `
      <div class="card" style="max-width:650px;margin:30px auto;padding:32px;">
        <div style="text-align:center;margin-bottom:24px;">
          <i data-lucide="award" style="width:56px;height:56px;color:var(--success);margin:0 auto 12px auto;"></i>
          <h2 style="font-weight:700">Kết quả bài làm</h2>
          <p style="color:var(--text-muted);margin-top:6px;">Lịch sử và sổ lỗi sai đã được cập nhật thành công.</p>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;text-align:center;">
          <div style="background-color:var(--bg-primary);padding:16px;border-radius:var(--radius-md);border:1px solid var(--border-color)">
            <span style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;">Số câu đúng</span>
            <h3 style="font-size:1.8rem;font-weight:700;color:var(--primary);margin-top:4px;">
              ${correct} / ${total}
            </h3>
          </div>
          <div style="background-color:var(--bg-primary);padding:16px;border-radius:var(--radius-md);border:1px solid var(--border-color)">
            <span style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;">Tiết kiệm thời gian</span>
            <h3 style="font-size:1.8rem;font-weight:700;color:var(--success);margin-top:4px;">
              Còn lại ${min} phút
            </h3>
          </div>
        </div>
    `;

    if (errors.length > 0) {
      html += `
        <div style="margin-bottom:24px;">
          <h4 style="color:var(--danger);margin-bottom:10px;display:flex;align-items:center;gap:6px;">
            <i data-lucide="book-x" style="width:18px;height:18px;"></i> Các câu trả lời sai (${errors.length} câu)
          </h4>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:12px;">Đã được lưu vào <strong>Sổ lỗi sai (Mistake Notebook)</strong> để ôn lại.</p>
          <div style="max-height:180px;overflow-y:auto;background-color:var(--bg-primary);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:10px;">
            ${errors.map(err => `
              <div style="display:flex;justify-content:between;padding:8px 0;border-bottom:1px solid var(--border-color);font-size:0.85rem;">
                <span>Câu số <strong>${err.num}</strong></span>
                <span style="color:var(--danger)">Bản dịch: ${err.userAnswer}</span>
                <span style="color:var(--success);font-weight:600">Đáp án: ${err.correctAnswer}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      html += `
        <div style="text-align:center;color:var(--success);margin-bottom:24px;padding:12px;background-color:rgba(16, 185, 129, 0.05);border-radius:var(--radius-md);border:1px solid rgba(16,185,129,0.15)">
          <strong>🎉 Tuyệt vời!</strong> Bạn đạt điểm tuyệt đối 100% cho kỹ năng này!
        </div>
      `;
    }

    html += `
        <div style="display:flex;gap:12px;margin-top:32px;">
          <button class="btn btn-secondary" onclick="window.location.hash='#cambridge'" style="flex-grow:1;">
            Quay lại Thư viện
          </button>
          <button class="btn btn-primary" onclick="window.location.hash='#mistakes'" style="flex-grow:1;">
            Xem Sổ lỗi sai
          </button>
        </div>
      </div>
    `;

    root.innerHTML = html;
    lucide.createIcons();
  }
};
