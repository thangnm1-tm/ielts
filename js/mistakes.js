/* ==========================================================================
   MISTAKES NOTEBOOK MODULE (Error tracking & self-correction)
   ========================================================================== */

const MistakesModule = {
  activeFilters: {
    skill: 'All'
  },

  render(container) {
    this.container = container;
    this.renderMistakesNotebook();
  },

  renderMistakesNotebook() {
    const mistakesList = AppState.getMistakes();

    this.container.innerHTML = `
      <div class="vocabulary-layout">
        
        <!-- Module Header -->
        <div class="view-header">
          <div class="view-header-title">
            <h1>Sổ tay sửa lỗi sai</h1>
            <p>Phân tích nguyên nhân làm sai để tránh lặp lại lỗi cũ trong các đề test tiếp theo.</p>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="filter-bar">
          <select id="mistake-filter-skill" class="filter-select" onchange="MistakesModule.filterSkill(this.value)">
            <option value="All" ${this.activeFilters.skill === 'All' ? 'selected' : ''}>Kỹ năng: Tất cả</option>
            <option value="Reading" ${this.activeFilters.skill === 'Reading' ? 'selected' : ''}>Reading</option>
            <option value="Listening" ${this.activeFilters.skill === 'Listening' ? 'selected' : ''}>Listening</option>
          </select>
          
          <div style="font-size:0.85rem;color:var(--text-muted);margin-left:auto;">
            Tổng cộng: <strong>${mistakesList.length} lỗi sai</strong> đã ghi nhận
          </div>
        </div>

        <!-- Mistakes Catalog List -->
        <div id="mistakes-items-list" style="display:flex;flex-direction:column;gap:20px;">
          <!-- Dynamically populated -->
        </div>

      </div>
    `;

    this.renderMistakeCards(mistakesList);
    lucide.createIcons();
  },

  filterSkill(skill) {
    this.activeFilters.skill = skill;
    const list = AppState.getMistakes();
    this.renderMistakeCards(list);
  },

  renderMistakeCards(list) {
    const container = document.getElementById('mistakes-items-list');
    if (!container) return;

    // Filter Logic
    const filtered = list.filter(m => {
      return this.activeFilters.skill === 'All' || m.skill === this.activeFilters.skill;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center;padding:40px;color:var(--text-muted);">
          <i data-lucide="check-circle" style="width:48px;height:48px;color:var(--success);margin:0 auto 16px auto;"></i>
          <h3>Không có lỗi sai nào!</h3>
          <p style="margin-top:6px;font-size:0.85rem;">Chúc mừng bạn, danh sách sửa lỗi hiện tại đang trống.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    // Sort by recent first
    filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    container.innerHTML = filtered.map(m => {
      const isReading = m.skill === 'Reading';
      return `
        <div class="card mistake-card" id="mistake-card-${m.id}">
          <div class="mistake-header">
            <div class="mistake-meta-title">
              <span class="badge ${isReading ? 'badge-learning' : 'badge-mastered'}" style="margin-right:8px;">
                ${m.skill}
              </span>
              <strong>${m.testTitle}</strong>
              <span style="margin-left:12px;color:var(--text-muted);">Câu số ${m.questionNumber}</span>
            </div>
            
            <button class="btn btn-outline btn-sm" onclick="MistakesModule.deleteMistake('${m.id}')" style="color:var(--success);border-color:rgba(16,185,129,0.15);" title="Đánh dấu đã hiểu lỗi này">
              <i data-lucide="check" style="width:14px;height:14px;"></i> Đã sửa lỗi
            </button>
          </div>

          <!-- Answer Comparison Grid -->
          <div class="answers-compare">
            <div class="answer-box user">
              <div class="answer-label">Đáp án của bạn</div>
              <div class="answer-val">${m.userAnswer || 'Không trả lời'}</div>
            </div>
            <div class="answer-box correct">
              <div class="answer-label">Đáp án đúng</div>
              <div class="answer-val">${m.correctAnswer}</div>
            </div>
          </div>

          <!-- Diagnoses Rows -->
          <div class="mistake-reason-row">
            
            <!-- Reason Selection -->
            <div class="form-group">
              <label>Lý do làm sai:</label>
              <select class="filter-select" onchange="MistakesModule.saveMistakeReason('${m.id}', this.value)" style="background-color:var(--bg-primary);">
                <option value="Chưa phân tích" ${m.reason === 'Chưa phân tích' ? 'selected' : ''}>-- Chọn lý do --</option>
                <option value="Nhầm từ khóa (Keywords)" ${m.reason === 'Nhầm từ khóa (Keywords)' ? 'selected' : ''}>Nhầm từ khóa (Keywords)</option>
                <option value="Nhầm False với Not Given" ${m.reason === 'Nhầm False với Not Given' ? 'selected' : ''}>Nhầm False với Not Given</option>
                <option value="Sai chính tả (Spelling)" ${m.reason === 'Sai chính tả (Spelling)' ? 'selected' : ''}>Sai chính tả (Spelling)</option>
                <option value="Thiếu thời gian làm bài" ${m.reason === 'Thiếu thời gian làm bài' ? 'selected' : ''}>Thiếu thời gian làm bài</option>
                <option value="Không nghe kịp Audio" ${m.reason === 'Không nghe kịp Audio' ? 'selected' : ''}>Không nghe kịp Audio</option>
                <option value="Bất cẩn đọc lướt nhanh" ${m.reason === 'Bất cẩn đọc lướt nhanh' ? 'selected' : ''}>Bất cẩn đọc lướt nhanh</option>
                <option value="Khác" ${m.reason === 'Khác' ? 'selected' : ''}>Khác (Ghi chú chi tiết)</option>
              </select>
            </div>

            <!-- Custom Note Textarea -->
            <div class="form-group">
              <label>Ghi chú bài học kinh nghiệm:</label>
              <textarea rows="2" class="exam-text-input" style="height:38px;padding:6px 12px;background-color:var(--bg-primary);" placeholder="Ví dụ: Cần phân biệt kỹ từ trái nghĩa hoàn toàn (FALSE) với thông tin không được nhắc đến (NOT GIVEN)..." onchange="MistakesModule.saveMistakeNote('${m.id}', this.value)">${m.note || ''}</textarea>
            </div>

          </div>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  },

  saveMistakeReason(id, reasonVal) {
    const list = AppState.getMistakes();
    const item = list.find(m => m.id === id);
    if (item) {
      AppState.saveMistake({ ...item, reason: reasonVal });
      window.showToast('Đã cập nhật lý do làm sai!', 'info');
    }
  },

  saveMistakeNote(id, noteVal) {
    const list = AppState.getMistakes();
    const item = list.find(m => m.id === id);
    if (item) {
      AppState.saveMistake({ ...item, note: noteVal.trim() });
      window.showToast('Đã lưu ghi chú lỗi sai!', 'success');
    }
  },

  deleteMistake(id) {
    AppState.deleteMistake(id);
    window.showToast('Đã xóa lỗi sai khỏi danh sách!', 'success');
    
    // Animate item slide-out in DOM
    const card = document.getElementById(`mistake-card-${id}`);
    if (card) {
      card.style.transition = 'all 0.4s ease';
      card.style.opacity = '0';
      card.style.transform = 'translateX(-20px)';
      setTimeout(() => {
        const list = AppState.getMistakes();
        this.renderMistakeCards(list);
      }, 400);
    }
  }
};
