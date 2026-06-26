/* ==========================================================================
   DASHBOARD VIEW RENDERER
   ========================================================================== */

const DashboardModule = {
  render(container) {
    const user = AppState.getUser();
    const vocab = AppState.getVocabularies();
    const attempts = AppState.getAttempts();
    const mistakes = AppState.getMistakes();
    const plans = AppState.getPlans();

    // 1. Calculate Statistics
    const todayStr = new Date().toISOString().split('T')[0];
    const reviewWords = vocab.filter(v => v.nextReviewDate <= todayStr || v.status === 'Chưa thuộc');
    const reviewCount = reviewWords.length;
    
    const masteredWordsCount = vocab.filter(v => v.status === 'Đã thuộc').length;
    const masteryPercentage = vocab.length > 0 ? Math.round((masteredWordsCount / vocab.length) * 100) : 0;

    // Average Band calculation based on mock exams
    const practiceAttempts = attempts.filter(a => a.skill === 'Reading' || a.skill === 'Listening');
    let avgCorrect = 0;
    let avgCorrectText = 'Chưa làm bài';
    if (practiceAttempts.length > 0) {
      const sum = practiceAttempts.reduce((acc, curr) => acc + (curr.totalCorrect || 0), 0);
      avgCorrect = (sum / practiceAttempts.length).toFixed(1);
      avgCorrectText = `${avgCorrect}/40`;
    }

    // Daily plan preview
    const daysOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const currentDayName = daysOfWeek[new Date().getDay()];
    const todayPlan = plans.find(p => p.day === currentDayName) || { task: 'Tự do học tập + ôn từ mới', completed: false };

    // 2. Build Dashboard Layout HTML
    container.innerHTML = `
      <div class="dashboard-grid">
        
        <!-- Welcome Banner -->
        <div class="welcome-banner">
          <div class="welcome-info">
            <h1>Chào mừng trở lại, ${user.username}!</h1>
            <p>Đã đến lúc củng cố mục tiêu IELTS ${user.targetBand} của bạn hôm nay. Bắt đầu ngay thôi!</p>
          </div>
          <div class="welcome-meta">
            <div class="meta-box">
              <span>Mục tiêu</span>
              <h3>Band ${user.targetBand}</h3>
            </div>
            <div class="meta-box">
              <span>Cần ôn hôm nay</span>
              <h3>${reviewCount} từ</h3>
            </div>
          </div>
        </div>

        <!-- Statistics Row -->
        <div class="stat-card-row">
          
          <div class="card stat-card">
            <div class="stat-icon">
              <i data-lucide="book-open"></i>
            </div>
            <div class="stat-info">
              <span>Từ vựng đã lưu</span>
              <h2>${vocab.length}</h2>
            </div>
          </div>

          <div class="card stat-card">
            <div class="stat-icon">
              <i data-lucide="clock"></i>
            </div>
            <div class="stat-info">
              <span>Từ cần ôn tập</span>
              <h2>${reviewCount}</h2>
            </div>
          </div>

          <div class="card stat-card">
            <div class="stat-icon">
              <i data-lucide="award"></i>
            </div>
            <div class="stat-info">
              <span>Điểm trung bình</span>
              <h2>${avgCorrectText}</h2>
            </div>
          </div>

          <div class="card stat-card">
            <div class="stat-icon">
              <i data-lucide="flame"></i>
            </div>
            <div class="stat-info">
              <span>Học liên tục</span>
              <h2>${user.streak} ngày</h2>
            </div>
          </div>

        </div>

        <!-- Left Main Column (Actions & History) -->
        <div class="dash-main-col">
          
          <!-- Rapid Actions -->
          <div class="card">
            <h3 class="card-header-actions">Hành động nhanh</h3>
            <div class="action-row-buttons">
              <div class="action-card" onclick="window.location.hash='#vocabulary?mode=flashcard'">
                <i data-lucide="layers"></i>
                <h4>Ôn Flashcards</h4>
                <p style="font-size:0.75rem;color:var(--text-muted)">Lặp lại ngắt quãng</p>
              </div>
              <div class="action-card" onclick="window.location.hash='#quiz'">
                <i data-lucide="brain-circuit"></i>
                <h4>Làm bài test từ</h4>
                <p style="font-size:0.75rem;color:var(--text-muted)">Trắc nghiệm & viết lại</p>
              </div>
              <div class="action-card" onclick="window.location.hash='#cambridge'">
                <i data-lucide="file-text"></i>
                <h4>Luyện đề Cambridge</h4>
                <p style="font-size:0.75rem;color:var(--text-muted)">Reading & Listening</p>
              </div>
              <div class="action-card" onclick="window.location.hash='#mistakes'">
                <i data-lucide="book-x"></i>
                <h4>Sổ lỗi sai</h4>
                <p style="font-size:0.75rem;color:var(--text-muted)">Tổng hợp câu làm sai</p>
              </div>
            </div>
          </div>

          <!-- Recent Attempts History -->
          <div class="card">
            <div class="card-header-actions">
              <h3>Lịch sử học tập gần đây</h3>
              <button class="btn btn-outline btn-sm" onclick="window.location.hash='#analytics'">Xem chi tiết</button>
            </div>
            <div class="history-list" id="dash-history-list">
              <!-- Dynamically populated -->
            </div>
          </div>

        </div>

        <!-- Right Side Column (Progress Circle, Review pile & Daily task) -->
        <div class="dash-side-col">
          
          <!-- Mastery Progress -->
          <div class="card">
            <h3 style="margin-bottom:16px;">Tiến độ thuộc từ vựng</h3>
            <div class="progress-circle-widget">
              <svg class="circle-svg">
                <defs>
                  <linearGradient id="indigo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="var(--primary)"/>
                    <stop offset="100%" stop-color="var(--accent)"/>
                  </linearGradient>
                </defs>
                <circle class="circle-bg" cx="40" cy="40" r="32"></circle>
                <circle class="circle-fill" cx="40" cy="40" r="32" 
                  stroke-dasharray="${2 * Math.PI * 32}" 
                  stroke-dashoffset="${2 * Math.PI * 32 * (1 - masteryPercentage / 100)}">
                </circle>
              </svg>
              <div>
                <h4 style="font-size:1.2rem;font-weight:700">${masteryPercentage}%</h4>
                <p style="font-size:0.8rem;color:var(--text-muted)">Đã thuộc: ${masteredWordsCount}/${vocab.length} từ</p>
              </div>
            </div>
          </div>

          <!-- Study Plan for Today -->
          <div class="card">
            <h3 style="margin-bottom:12px;">Kế hoạch hôm nay (${currentDayName})</h3>
            <div class="active-plan-preview">
              <div class="active-plan-info">
                <h4>${todayPlan.task}</h4>
                <p>${todayPlan.completed ? 'Đã hoàn thành xuất sắc' : 'Chưa hoàn thành'}</p>
              </div>
              <button class="btn btn-outline btn-sm" onclick="window.location.hash='#planner'">
                <i data-lucide="${todayPlan.completed ? 'check-square' : 'square'}"></i>
              </button>
            </div>
          </div>

          <!-- Vocabulary review preview list -->
          <div class="card">
            <h3 style="margin-bottom:12px;">Từ vựng cần ôn hôm nay</h3>
            <div class="dash-vocab-pile" id="dash-vocab-pile">
              <!-- Dynamically populated -->
            </div>
          </div>

        </div>

      </div>
    `;

    // 3. Render dynamic sections
    this.renderHistoryList(attempts);
    this.renderVocabPile(reviewWords);
    
    // Refresh icons inside rendered contents
    lucide.createIcons();
  },

  renderHistoryList(attempts) {
    const listContainer = document.getElementById('dash-history-list');
    if (!listContainer) return;

    if (attempts.length === 0) {
      listContainer.innerHTML = `<p style="font-size:0.85rem;color:var(--text-muted);text-align:center;padding:12px;">Chưa có hoạt động nào. Hãy làm đề Cambridge hoặc kiểm tra từ vựng!</p>`;
      return;
    }

    // Sort by complete date descending, take top 4
    const sorted = [...attempts].sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt)).slice(0, 4);

    listContainer.innerHTML = sorted.map(att => {
      let icon = 'file-text';
      let cssClass = 'reading';
      let title = '';
      let scoreText = '';

      if (att.skill === 'Reading') {
        icon = 'book-open';
        cssClass = 'reading';
        title = `${att.bookTitle} - ${att.testNumber} (Reading)`;
        scoreText = `${att.score}/40`;
      } else if (att.skill === 'Listening') {
        icon = 'headphones';
        cssClass = 'listening';
        title = `${att.bookTitle} - ${att.testNumber} (Listening)`;
        scoreText = `${att.score}/40`;
      } else if (att.skill === 'Writing') {
        icon = 'pen-tool';
        cssClass = 'reading'; // Style writing similarly
        title = `${att.bookTitle} - ${att.testNumber} (Writing)`;
        scoreText = 'Đã lưu';
      } else if (att.skill === 'Speaking') {
        icon = 'mic';
        cssClass = 'quiz';
        title = `${att.bookTitle} - ${att.testNumber} (Speaking)`;
        scoreText = 'Đã ghi âm';
      } else {
        // Vocabulary Test
        icon = 'brain-circuit';
        cssClass = 'quiz';
        title = att.testType || 'Kiểm tra từ vựng';
        scoreText = `${att.correctAnswers}/${att.totalQuestions}`;
      }

      const dateStr = new Date(att.completedAt).toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });

      return `
        <div class="history-item">
          <div class="history-icon-box ${cssClass}">
            <i data-lucide="${icon}"></i>
          </div>
          <div class="history-info">
            <h4>${title}</h4>
            <span>Thời gian làm: ${Math.round(att.timeSpent / 60) || 1} phút • ${dateStr}</span>
          </div>
          <div class="history-badge">
            <div class="score">${scoreText}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderVocabPile(reviewWords) {
    const container = document.getElementById('dash-vocab-pile');
    if (!container) return;

    if (reviewWords.length === 0) {
      container.innerHTML = `<p style="font-size:0.85rem;color:var(--text-muted);text-align:center;padding:12px;"> Tuyệt vời! Hôm nay bạn không còn từ nào cần ôn tập.</p>`;
      return;
    }

    // Limit to 4 review words preview
    const previewList = reviewWords.slice(0, 4);

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${previewList.map(v => `
          <div style="padding:10px 14px;background-color:var(--bg-primary);border-radius:var(--radius-md);border:1px solid var(--border-color);display:flex;justify-content:between;align-items:center;">
            <div>
              <strong style="color:var(--primary);font-size:0.9rem">${v.word}</strong> <span style="font-size:0.75rem;color:var(--text-muted)">${v.ipa}</span>
              <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:2px">${v.meaningVi}</div>
            </div>
            <span class="badge ${v.status === 'Chưa thuộc' ? 'badge-new' : 'badge-learning'}" style="font-size:0.65rem;flex-shrink:0;height:fit-content">${v.status}</span>
          </div>
        `).join('')}
        ${reviewWords.length > 4 ? `
          <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#vocabulary'" style="width:100%;margin-top:8px">Xem thêm ${reviewWords.length - 4} từ cần ôn...</button>
        ` : ''}
      </div>
    `;
  }
};
