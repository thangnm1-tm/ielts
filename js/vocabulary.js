/* ==========================================================================
   VOCABULARY NOTEBOOK MODULE (Flashcards & Word Database)
   ========================================================================== */

// TTS Pronunciation Helper
window.speakWord = function(text) {
  if ('speechSynthesis' in window) {
    // Cancel currently speaking audios first
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Slightly slower for clear IELTS study
    window.speechSynthesis.speak(utterance);
  } else {
    window.showToast('Trình duyệt không hỗ trợ phát âm (TTS)', 'warning');
  }
};

const VocabularyModule = {
  activeFilters: {
    search: '',
    topic: 'All',
    status: 'All',
    difficulty: 'All'
  },
  
  flashcardIndex: 0,
  flashcardQueue: [],

  render(container, queryParams = {}) {
    this.container = container;
    
    // Check if redirect is targeting flashcard mode
    if (queryParams.mode === 'flashcard') {
      this.renderFlashcardMode();
      return;
    }

    // Set search query if redirected from global search
    if (queryParams.search) {
      this.activeFilters.search = queryParams.search;
    }

    this.renderNotebookMode();
  },

  // --- 1. NOTEBOOK LIST MODE ---
  renderNotebookMode() {
    this.container.innerHTML = `
      <div class="vocabulary-layout">
        
        <!-- Module Header -->
        <div class="view-header">
          <div class="view-header-title">
            <h1>Sổ từ vựng cá nhân</h1>
            <p>Quản lý, tìm kiếm và phân loại từ vựng IELTS của bạn.</p>
          </div>
          <div class="view-header-actions">
            <button class="btn btn-outline" onclick="window.showModal('import-modal')">
              <i data-lucide="upload"></i> Import CSV
            </button>
            <button class="btn btn-outline" onclick="VocabularyModule.exportToCSV()">
              <i data-lucide="download"></i> Export CSV
            </button>
            <button class="btn btn-primary" onclick="VocabularyModule.openWordModal()">
              <i data-lucide="plus"></i> Thêm từ mới
            </button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="search-input-wrapper">
            <i data-lucide="search"></i>
            <input type="text" id="vocab-search-field" placeholder="Tìm kiếm từ vựng hoặc nghĩa tiếng Việt..." value="${this.activeFilters.search}">
          </div>
          
          <select id="filter-topic" class="filter-select">
            <option value="All" ${this.activeFilters.topic === 'All' ? 'selected' : ''}>Chủ đề: Tất cả</option>
            <option value="Environment" ${this.activeFilters.topic === 'Environment' ? 'selected' : ''}>Environment</option>
            <option value="Education" ${this.activeFilters.topic === 'Education' ? 'selected' : ''}>Education</option>
            <option value="Technology" ${this.activeFilters.topic === 'Technology' ? 'selected' : ''}>Technology</option>
            <option value="Health" ${this.activeFilters.topic === 'Health' ? 'selected' : ''}>Health</option>
            <option value="Work" ${this.activeFilters.topic === 'Work' ? 'selected' : ''}>Work</option>
            <option value="Culture" ${this.activeFilters.topic === 'Culture' ? 'selected' : ''}>Culture</option>
            <option value="General" ${this.activeFilters.topic === 'General' ? 'selected' : ''}>General</option>
          </select>

          <select id="filter-status" class="filter-select">
            <option value="All" ${this.activeFilters.status === 'All' ? 'selected' : ''}>Trạng thái: Tất cả</option>
            <option value="Chưa thuộc" ${this.activeFilters.status === 'Chưa thuộc' ? 'selected' : ''}>Chưa thuộc</option>
            <option value="Đang học" ${this.activeFilters.status === 'Đang học' ? 'selected' : ''}>Đang học</option>
            <option value="Đã thuộc" ${this.activeFilters.status === 'Đã thuộc' ? 'selected' : ''}>Đã thuộc</option>
          </select>

          <select id="filter-difficulty" class="filter-select">
            <option value="All" ${this.activeFilters.difficulty === 'All' ? 'selected' : ''}>Độ khó: Tất cả</option>
            <option value="Dễ" ${this.activeFilters.difficulty === 'Dễ' ? 'selected' : ''}>Dễ</option>
            <option value="Trung bình" ${this.activeFilters.difficulty === 'Trung bình' ? 'selected' : ''}>Trung bình</option>
            <option value="Khó" ${this.activeFilters.difficulty === 'Khó' ? 'selected' : ''}>Khó</option>
          </select>

          <button class="btn btn-secondary" onclick="window.location.hash='#vocabulary?mode=flashcard'">
            <i data-lucide="layers"></i> Chạy Flashcard
          </button>
        </div>

        <!-- Vocabulary Data Table -->
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Từ vựng</th>
                <th>Phiên âm</th>
                <th>Nghĩa tiếng Việt</th>
                <th>Từ loại</th>
                <th>Chủ đề</th>
                <th>Độ khó</th>
                <th>Trạng thái</th>
                <th>Lịch ôn</th>
                <th style="width: 120px;">Hành động</th>
              </tr>
            </thead>
            <tbody id="vocab-table-body">
              <!-- Rendered rows -->
            </tbody>
          </table>
        </div>

      </div>
    `;

    this.bindEvents();
    this.renderTableRows();
    lucide.createIcons();
  },

  renderTableRows() {
    const list = AppState.getVocabularies();
    const tbody = document.getElementById('vocab-table-body');
    if (!tbody) return;

    // Filter Logic
    const filtered = list.filter(v => {
      const matchSearch = v.word.toLowerCase().includes(this.activeFilters.search.toLowerCase()) || 
                          v.meaningVi.toLowerCase().includes(this.activeFilters.search.toLowerCase());
      const matchTopic = this.activeFilters.topic === 'All' || v.topic === this.activeFilters.topic;
      const matchStatus = this.activeFilters.status === 'All' || v.status === this.activeFilters.status;
      const matchDiff = this.activeFilters.difficulty === 'All' || v.difficulty === this.activeFilters.difficulty;

      return matchSearch && matchTopic && matchStatus && matchDiff;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 30px;">
            Không tìm thấy từ vựng nào khớp với điều kiện lọc.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(v => {
      let badgeClass = 'badge-new';
      if (v.status === 'Đang học') badgeClass = 'badge-learning';
      if (v.status === 'Đã thuộc') badgeClass = 'badge-mastered';

      const nextReviewStr = new Date(v.nextReviewDate).toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'numeric'
      });

      return `
        <tr>
          <td class="word-column">
            <span style="cursor: pointer;" onclick="speakWord('${v.word}')" title="Bấm để phát âm">${v.word}</span>
          </td>
          <td class="ipa-column">${v.ipa}</td>
          <td style="font-weight: 500;">${v.meaningVi}</td>
          <td style="font-style: italic; color: var(--text-secondary);">${v.partOfSpeech}</td>
          <td><span class="topic-column">${v.topic}</span></td>
          <td>${v.difficulty}</td>
          <td><span class="badge ${badgeClass}">${v.status}</span></td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">${nextReviewStr}</td>
          <td>
            <div class="vocab-actions-col">
              <button class="icon-action-btn speak" onclick="speakWord('${v.word}')" title="Phát âm">
                <i data-lucide="volume-2" style="width:16px;height:16px;"></i>
              </button>
              <button class="icon-action-btn edit" onclick="VocabularyModule.openWordModal('${v.id}')" title="Chỉnh sửa">
                <i data-lucide="edit" style="width:16px;height:16px;"></i>
              </button>
              <button class="icon-action-btn delete" onclick="VocabularyModule.deleteWord('${v.id}')" title="Xóa">
                <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    lucide.createIcons();
  },

  bindEvents() {
    // Search Field
    const searchField = document.getElementById('vocab-search-field');
    searchField.addEventListener('input', (e) => {
      this.activeFilters.search = e.target.value;
      this.renderTableRows();
    });

    // Filters Selects
    document.getElementById('filter-topic').addEventListener('change', (e) => {
      this.activeFilters.topic = e.target.value;
      this.renderTableRows();
    });

    document.getElementById('filter-status').addEventListener('change', (e) => {
      this.activeFilters.status = e.target.value;
      this.renderTableRows();
    });

    document.getElementById('filter-difficulty').addEventListener('change', (e) => {
      this.activeFilters.difficulty = e.target.value;
      this.renderTableRows();
    });

    // Listen to global searches from the app header
    document.addEventListener('vocabularySearch', (e) => {
      this.activeFilters.search = e.detail;
      const f = document.getElementById('vocab-search-field');
      if (f) f.value = e.detail;
      this.renderTableRows();
    });

    // Note: word-form and import-form submit handlers are bound globally
    // in app.js initForms() so they work from any page (Cambridge, Dashboard, etc.)
  },

  // Modal actions
  openWordModal(id = null) {
    const modalTitle = document.getElementById('word-modal-title');
    const form = document.getElementById('word-form');
    form.reset();
    
    if (id) {
      // Edit mode
      modalTitle.textContent = 'Chỉnh sửa từ vựng';
      const vocabList = AppState.getVocabularies();
      const wordObj = vocabList.find(v => v.id === id);
      if (wordObj) {
        document.getElementById('vocab-id').value = wordObj.id;
        document.getElementById('vocab-word').value = wordObj.word;
        document.getElementById('vocab-ipa').value = wordObj.ipa || '';
        document.getElementById('vocab-meaning-vi').value = wordObj.meaningVi;
        document.getElementById('vocab-meaning-en').value = wordObj.meaningEn || '';
        document.getElementById('vocab-part-of-speech').value = wordObj.partOfSpeech;
        document.getElementById('vocab-topic').value = wordObj.topic;
        document.getElementById('vocab-level').value = wordObj.difficulty;
        document.getElementById('vocab-source').value = wordObj.source || '';
        document.getElementById('vocab-status').value = wordObj.status;
        document.getElementById('vocab-example').value = wordObj.example || '';
      }
    } else {
      // Add new mode
      modalTitle.textContent = 'Thêm từ vựng mới';
      document.getElementById('vocab-id').value = '';
    }
    
    window.showModal('word-modal');
  },

  deleteWord(id) {
    if (confirm('Bạn có chắc chắn muốn xóa từ vựng này khỏi sổ tay?')) {
      AppState.deleteVocabulary(id);
      window.showToast('Đã xóa từ vựng thành công!', 'error');
      this.renderTableRows();
    }
  },

  // CSV Importer logic
  parseCSVText(text) {
    const lines = text.split('\n');
    if (lines.length < 2) return [];

    // Detect header mapping
    const headers = lines[0].toLowerCase().split(/[,\t]/).map(h => h.trim());
    const data = [];

    const wordIdx = headers.indexOf('word');
    const meaningIdx = headers.indexOf('meaning');
    const topicIdx = headers.indexOf('topic');
    const exampleIdx = headers.indexOf('example');

    if (wordIdx === -1 || meaningIdx === -1) {
      // Fallback index matching: col 0 is Word, col 1 is Meaning
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/[,\t]/);
        if (parts.length >= 2 && parts[0].trim()) {
          data.push({
            word: parts[0].trim(),
            meaningVi: parts[1].trim(),
            topic: parts[2] ? parts[2].trim() : 'General',
            example: parts[3] ? parts[3].trim() : ''
          });
        }
      }
      return data;
    }

    // Structured CSV parsing
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quotes
      const parts = [];
      let currentPart = '';
      let insideQuote = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          parts.push(currentPart.trim());
          currentPart = '';
        } else {
          currentPart += char;
        }
      }
      parts.push(currentPart.trim());

      if (parts[wordIdx]) {
        data.push({
          word: parts[wordIdx].replace(/^"|"$/g, ''),
          meaningVi: parts[meaningIdx] ? parts[meaningIdx].replace(/^"|"$/g, '') : '',
          topic: topicIdx !== -1 && parts[topicIdx] ? parts[topicIdx].replace(/^"|"$/g, '') : 'General',
          example: exampleIdx !== -1 && parts[exampleIdx] ? parts[exampleIdx].replace(/^"|"$/g, '') : ''
        });
      }
    }

    return data;
  },

  // Export to CSV
  exportToCSV() {
    const list = AppState.getVocabularies();
    if (list.length === 0) {
      window.showToast('Không có dữ liệu từ vựng để xuất!', 'warning');
      return;
    }

    const headers = ['Word', 'IPA', 'Meaning_VI', 'Meaning_EN', 'PartOfSpeech', 'Topic', 'Difficulty', 'Status', 'Example'];
    const rows = list.map(v => [
      `"${v.word.replace(/"/g, '""')}"`,
      `"${v.ipa ? v.ipa.replace(/"/g, '""') : ''}"`,
      `"${v.meaningVi.replace(/"/g, '""')}"`,
      `"${v.meaningEn ? v.meaningEn.replace(/"/g, '""') : ''}"`,
      `"${v.partOfSpeech}"`,
      `"${v.topic}"`,
      `"${v.difficulty}"`,
      `"${v.status}"`,
      `"${v.example ? v.example.replace(/"/g, '""') : ''}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ielts_study_hub_vocabularies.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.showToast('Đã tải xuống file CSV sổ từ vựng!');
  },

  // --- 2. FLASHCARD REPETITION MODE ---
  renderFlashcardMode() {
    const vocab = AppState.getVocabularies();
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Select review queue: words that have review scheduled on or before today
    this.flashcardQueue = vocab.filter(v => v.nextReviewDate <= todayStr || v.status === 'Chưa thuộc');
    
    // Fallback: If no cards are due, offer to review all words
    if (this.flashcardQueue.length === 0) {
      if (vocab.length === 0) {
        this.container.innerHTML = `
          <div class="flashcards-container card">
            <h3 style="text-align:center;">Sổ từ vựng trống</h3>
            <p style="text-align:center;color:var(--text-muted);margin:12px 0 24px 0;">Vui lòng thêm từ mới để bắt đầu học flashcards.</p>
            <button class="btn btn-primary" onclick="window.location.hash='#vocabulary'">Quay lại danh sách</button>
          </div>
        `;
        return;
      }
      this.flashcardQueue = [...vocab];
      this.isReviewAllMode = true;
    } else {
      this.isReviewAllMode = false;
    }

    this.flashcardIndex = 0;
    this.renderActiveFlashcard();
  },

  renderActiveFlashcard() {
    if (this.flashcardIndex >= this.flashcardQueue.length) {
      this.container.innerHTML = `
        <div class="flashcards-container card">
          <i data-lucide="sparkles" style="width:48px;height:48px;color:var(--warning);margin:0 auto 16px auto;"></i>
          <h2 style="text-align:center;font-weight:700;">Hoàn thành ôn tập!</h2>
          <p style="text-align:center;color:var(--text-secondary);margin:8px 0 24px 0;">Bạn đã hoàn tất tất cả thẻ học trong hàng đợi ôn tập hôm nay.</p>
          <div style="display:flex;gap:12px;">
            <button class="btn btn-secondary" onclick="window.location.hash='#vocabulary'">Về danh sách</button>
            <button class="btn btn-primary" onclick="VocabularyModule.renderFlashcardMode()">Ôn tiếp</button>
          </div>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    const wordObj = this.flashcardQueue[this.flashcardIndex];
    
    this.container.innerHTML = `
      <div class="flashcards-container">
        <div class="view-header" style="width:100%;">
          <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#vocabulary'">
            <i data-lucide="arrow-left"></i> Quay lại
          </button>
          <span style="font-size:0.85rem;color:var(--text-muted)">
            Thẻ ${this.flashcardIndex + 1} / ${this.flashcardQueue.length} ${this.isReviewAllMode ? '(Review All)' : '(Cần ôn)'}
          </span>
        </div>

        <!-- 3D Flip Card -->
        <div class="flashcard-wrapper" id="active-flashcard" onclick="VocabularyModule.flipCard()">
          <div class="flashcard-inner">
            
            <!-- Front Face -->
            <div class="flashcard-face flashcard-front">
              <span class="badge ${wordObj.status === 'Chưa thuộc' ? 'badge-new' : 'badge-learning'}" style="margin-bottom:auto;">
                ${wordObj.status}
              </span>
              <h2 class="card-title-lg">${wordObj.word}</h2>
              <span class="card-ipa">${wordObj.ipa}</span>
              <button class="btn btn-outline btn-sm" style="pointer-events:none;">
                <i data-lucide="volume-2"></i> ${wordObj.partOfSpeech}
              </button>
              <div class="flip-prompt">
                <i data-lucide="refresh-cw"></i> Click thẻ để lật xem nghĩa
              </div>
            </div>

            <!-- Back Face (Revealed on flip) -->
            <div class="flashcard-face flashcard-back" onclick="event.stopPropagation()">
              <h3 class="card-meaning-vi">${wordObj.meaningVi}</h3>
              <p class="card-meaning-en">${wordObj.meaningEn || 'Không có định nghĩa tiếng Anh'}</p>
              
              ${wordObj.example ? `<p class="card-example">"${wordObj.example}"</p>` : ''}
              
              <div style="margin-top:auto;width:100%;">
                <p style="font-size:0.75rem;color:var(--text-muted);text-align:center;margin-bottom:12px;">Bạn nhớ từ này thế nào?</p>
                <div class="spaced-rep-buttons">
                  <button class="srs-btn srs-forgot" onclick="VocabularyModule.handleSpacedRepetitionFeedback('forgot')">Quên</button>
                  <button class="srs-btn srs-vague" onclick="VocabularyModule.handleSpacedRepetitionFeedback('vague')">Mơ hồ</button>
                  <button class="srs-btn srs-good" onclick="VocabularyModule.handleSpacedRepetitionFeedback('good')">Nhớ tốt</button>
                  <button class="srs-btn srs-mastered" onclick="VocabularyModule.handleSpacedRepetitionFeedback('mastered')">Đã thuộc</button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Navigation helper shortcuts -->
        <div class="flashcard-nav">
          <button class="btn btn-secondary btn-sm" onclick="VocabularyModule.prevFlashcard()">
            <i data-lucide="chevron-left"></i> Trước
          </button>
          <button class="btn btn-secondary btn-sm" onclick="speakWord('${wordObj.word}')">
            <i data-lucide="volume-2"></i> Phát âm
          </button>
          <button class="btn btn-secondary btn-sm" onclick="VocabularyModule.nextFlashcard()">
            Sau <i data-lucide="chevron-right"></i>
          </button>
        </div>
      </div>
    `;

    lucide.createIcons();
    // Auto speak word on show
    speakWord(wordObj.word);
  },

  flipCard() {
    const card = document.getElementById('active-flashcard');
    if (card) card.classList.toggle('flipped');
  },

  prevFlashcard() {
    if (this.flashcardIndex > 0) {
      this.flashcardIndex--;
      this.renderActiveFlashcard();
    }
  },

  nextFlashcard() {
    if (this.flashcardIndex < this.flashcardQueue.length - 1) {
      this.flashcardIndex++;
      this.renderActiveFlashcard();
    } else {
      // Loop or finish
      this.flashcardIndex = this.flashcardQueue.length; // triggers finished screen
      this.renderActiveFlashcard();
    }
  },

  // Spaced Repetition Scheduling Calculator
  handleSpacedRepetitionFeedback(choice) {
    const wordObj = this.flashcardQueue[this.flashcardIndex];
    let intervalDays = 1;
    let newStatus = 'Chưa thuộc';

    if (choice === 'forgot') {
      intervalDays = 1;
      newStatus = 'Chưa thuộc';
    } else if (choice === 'vague') {
      intervalDays = 3;
      newStatus = 'Đang học';
    } else if (choice === 'good') {
      intervalDays = 7;
      newStatus = 'Đang học';
    } else if (choice === 'mastered') {
      intervalDays = 14;
      newStatus = 'Đã thuộc';
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    // Update in Storage
    AppState.saveVocabulary({
      ...wordObj,
      status: newStatus,
      nextReviewDate: nextDateStr
    });

    window.showToast(`Đã xếp lịch ôn sau ${intervalDays} ngày`, 'info');
    
    // Automatically advance to the next card
    setTimeout(() => {
      this.nextFlashcard();
    }, 200);
  }
};
