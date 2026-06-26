/* ==========================================================================
   PROGRESS ANALYTICS MODULE (SVG charts & performance insights)
   ========================================================================== */

const AnalyticsModule = {
  render(container) {
    this.container = container;
    
    const vocab = AppState.getVocabularies();
    const attempts = AppState.getAttempts();
    const mistakes = AppState.getMistakes();

    // Calculate aggregated statistics
    const totalVocab = vocab.length;
    const masteredVocab = vocab.filter(v => v.status === 'Đã thuộc').length;
    const learningVocab = vocab.filter(v => v.status === 'Đang học').length;
    const newVocab = vocab.filter(v => v.status === 'Chưa thuộc').length;

    const readingAttempts = attempts.filter(a => a.skill === 'Reading');
    const listeningAttempts = attempts.filter(a => a.skill === 'Listening');
    const writingAttempts = attempts.filter(a => a.skill === 'Writing');
    const speakingAttempts = attempts.filter(a => a.skill === 'Speaking');

    const avgReading = this.calculateAverageScore(readingAttempts);
    const avgListening = this.calculateAverageScore(listeningAttempts);

    this.container.innerHTML = `
      <div class="vocabulary-layout">
        
        <!-- Module Header -->
        <div class="view-header">
          <div class="view-header-title">
            <h1>Thống kê & Phân tích tiến bộ</h1>
            <p>Theo dõi điểm số, đánh giá lỗ hổng kiến thức và lộ trình hoàn thành mục tiêu.</p>
          </div>
        </div>

        <div class="analytics-grid">
          
          <!-- Vocabulary Progress Card -->
          <div class="card">
            <h3 style="margin-bottom:16px;">Phân tích kho từ vựng</h3>
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div>
                <div style="display:flex;justify-content:between;font-size:0.85rem;margin-bottom:4px;">
                  <span>Đã thuộc (Mastered)</span>
                  <strong>${masteredVocab} / ${totalVocab} từ</strong>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" style="width:${totalVocab ? (masteredVocab/totalVocab)*100 : 0}%;background:var(--success);"></div>
                </div>
              </div>

              <div>
                <div style="display:flex;justify-content:between;font-size:0.85rem;margin-bottom:4px;">
                  <span>Đang học (Learning)</span>
                  <strong>${learningVocab} / ${totalVocab} từ</strong>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" style="width:${totalVocab ? (learningVocab/totalVocab)*100 : 0}%;background:var(--primary);"></div>
                </div>
              </div>

              <div>
                <div style="display:flex;justify-content:between;font-size:0.85rem;margin-bottom:4px;">
                  <span>Chưa học (New)</span>
                  <strong>${newVocab} / ${totalVocab} từ</strong>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" style="width:${totalVocab ? (newVocab/totalVocab)*100 : 0}%;background:var(--warning);"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Academic Tasks Card -->
          <div class="card">
            <h3 style="margin-bottom:16px;">Tập luyện kỹ năng</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:center;">
              <div style="background-color:var(--bg-primary);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border-color)">
                <span style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Reading đã thi</span>
                <h3 style="font-size:1.6rem;color:var(--primary);margin-top:2px;">${readingAttempts.length} đề</h3>
                <span style="font-size:0.75rem;color:var(--text-muted);">Trung bình: ${avgReading}/40</span>
              </div>
              
              <div style="background-color:var(--bg-primary);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border-color)">
                <span style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Listening đã thi</span>
                <h3 style="font-size:1.6rem;color:var(--success);margin-top:2px;">${listeningAttempts.length} đề</h3>
                <span style="font-size:0.75rem;color:var(--text-muted);">Trung bình: ${avgListening}/40</span>
              </div>

              <div style="background-color:var(--bg-primary);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border-color)">
                <span style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Writing đã viết</span>
                <h3 style="font-size:1.6rem;color:var(--accent);margin-top:2px;">${writingAttempts.length} bài</h3>
              </div>

              <div style="background-color:var(--bg-primary);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border-color)">
                <span style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Speaking ghi âm</span>
                <h3 style="font-size:1.6rem;color:var(--warning);margin-top:2px;">${speakingAttempts.length} lần</h3>
              </div>
            </div>
          </div>

          <!-- Dynamic SVG Trend Chart Card -->
          <div class="card analytics-chart-card">
            <div class="card-header-actions">
              <div>
                <h3>Biểu đồ tiến bộ điểm số</h3>
                <p style="font-size:0.75rem;color:var(--text-muted)">Điểm Reading (Tím) và Listening (Xanh lá) qua các bài test</p>
              </div>
              <div style="display:flex;gap:12px;font-size:0.8rem;">
                <span style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:10px;height:10px;background:var(--primary);border-radius:var(--radius-full);"></span> Reading</span>
                <span style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:10px;height:10px;background:var(--success);border-radius:var(--radius-full);"></span> Listening</span>
              </div>
            </div>
            
            <div class="chart-container" id="trend-chart-box">
              <!-- Rendered SVG chart -->
            </div>
          </div>

          <!-- Diagnostic Mistakes Insights -->
          <div class="card" style="grid-column: span 2;">
            <h3>Chẩn đoán lỗi sai thường gặp</h3>
            <div style="margin-top:16px;" id="error-diagnosis-panel">
              <!-- Dynamically populated -->
            </div>
          </div>

        </div>

      </div>
    `;

    this.renderSVGChart(attempts);
    this.renderDiagnosis(mistakes);
    lucide.createIcons();
  },

  calculateAverageScore(attemptsList) {
    if (attemptsList.length === 0) return '0';
    const sum = attemptsList.reduce((acc, curr) => acc + (curr.totalCorrect || 0), 0);
    return (sum / attemptsList.length).toFixed(1);
  },

  // Dynamic SVG Graph Builder
  renderSVGChart(attempts) {
    const box = document.getElementById('trend-chart-box');
    if (!box) return;

    // Filter Reading & Listening mock attempts
    const validAttempts = attempts.filter(a => a.skill === 'Reading' || a.skill === 'Listening');
    
    // Sort chronologically
    validAttempts.sort((a,b) => new Date(a.completedAt) - new Date(b.completedAt));

    if (validAttempts.length === 0) {
      box.innerHTML = `<p style="font-size:0.85rem;color:var(--text-muted);text-align:center;padding:60px;">Hãy nộp ít nhất 1 bài thi thử Reading hoặc Listening để vẽ biểu đồ tiến bộ.</p>`;
      return;
    }

    const width = box.clientWidth || 600;
    const height = 220;
    const padLeft = 40;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 30;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // Grid y positions mapping (score 0, 10, 20, 30, 40)
    const yGridValues = [0, 10, 20, 30, 40];
    const gridLines = yGridValues.map(val => {
      const y = padTop + (1 - val / 40) * plotH;
      return `
        <line class="chart-grid-line" x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}"></line>
        <text class="chart-label" x="${padLeft - 10}" y="${y + 4}" text-anchor="end">${val}</text>
      `;
    }).join('');

    // Plot coordinate paths
    const readingPoints = [];
    const listeningPoints = [];

    // Separate skill lists
    const readList = validAttempts.filter(a => a.skill === 'Reading');
    const listenList = validAttempts.filter(a => a.skill === 'Listening');

    // Make X mapping divisor
    const maxPointsCount = Math.max(readList.length, listenList.length);
    const getX = (idx, total) => {
      if (total <= 1) return padLeft + plotW / 2;
      return padLeft + (idx / (total - 1)) * plotW;
    };
    
    const getY = (correctCount) => {
      const score = Math.min(Math.max(correctCount, 0), 40);
      return padTop + (1 - score / 40) * plotH;
    };

    // Draw reading lines
    let readPath = '';
    readList.forEach((att, idx) => {
      const x = getX(idx, readList.length);
      const y = getY(att.totalCorrect);
      readingPoints.push({ x, y, score: att.score, title: att.testNumber });
      if (idx === 0) readPath += `M ${x} ${y}`;
      else readPath += ` L ${x} ${y}`;
    });

    // Draw listening lines
    let listenPath = '';
    listenList.forEach((att, idx) => {
      const x = getX(idx, listenList.length);
      const y = getY(att.totalCorrect);
      listeningPoints.push({ x, y, score: att.score, title: att.testNumber });
      if (idx === 0) listenPath += `M ${x} ${y}`;
      else listenPath += ` L ${x} ${y}`;
    });

    // Build SVG Node Content
    let svgContent = `
      <svg class="chart-svg" width="100%" height="${height}" viewBox="0 0 ${width} ${height}">
        <!-- Y Gridlines -->
        ${gridLines}

        <!-- X Axis labels representing test sequence -->
        <line class="chart-axis-line" x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}"></line>
        
        <!-- Plot lines -->
        ${readPath ? `<path class="chart-line-reading" d="${readPath}"></path>` : ''}
        ${listenPath ? `<path class="chart-line-listening" d="${listenPath}"></path>` : ''}

        <!-- Reading Points circles -->
        ${readingPoints.map(p => `
          <circle class="chart-point reading" cx="${p.x}" cy="${p.y}" title="${p.title}: ${p.score}">
            <title>${p.title} Reading: ${p.score}</title>
          </circle>
        `).join('')}

        <!-- Listening Points circles -->
        ${listeningPoints.map(p => `
          <circle class="chart-point listening" cx="${p.x}" cy="${p.y}" title="${p.title}: ${p.score}">
            <title>${p.title} Listening: ${p.score}</title>
          </circle>
        `).join('')}
      </svg>
    `;

    box.innerHTML = svgContent;
  },

  // Diagnostics panel builder
  renderDiagnosis(mistakes) {
    const container = document.getElementById('error-diagnosis-panel');
    if (!container) return;

    if (mistakes.length === 0) {
      container.innerHTML = `
        <div class="insights-box">
          <h4>Chưa có chẩn đoán lỗi</h4>
          <p>Làm thêm đề Cambridge để hệ thống phân tích các lỗi sai và đưa ra lời khuyên ôn tập.</p>
        </div>
      `;
      return;
    }

    // Count categories of reasons
    const reasonsMap = {};
    mistakes.forEach(m => {
      const r = m.reason || 'Chưa phân tích';
      if (r !== 'Chưa phân tích') {
        reasonsMap[r] = (reasonsMap[r] || 0) + 1;
      }
    });

    // Sort reasons by counts
    const sortedReasons = Object.entries(reasonsMap).sort((a,b) => b[1] - a[1]);

    if (sortedReasons.length === 0) {
      container.innerHTML = `
        <div class="insights-box">
          <h4>Vui lòng phân loại lỗi sai trong Sổ lỗi sai</h4>
          <p>Truy cập mục <strong>Sổ lỗi sai</strong> và chọn lý do (như sai chính tả, nhầm từ khóa...) để kích hoạt thuật toán chẩn đoán tự động.</p>
        </div>
      `;
      return;
    }

    const topReason = sortedReasons[0][0];
    const topCount = sortedReasons[0][1];

    let suggestionText = 'Hãy tiếp tục làm đề và cẩn thận soát bài lại trước khi nộp.';
    if (topReason.includes('từ khóa')) {
      suggestionText = 'Bạn cần luyện tập kỹ năng <strong>Scanning & Skimming</strong>. Hãy gạch chân các keywords trong câu hỏi trước khi tìm kiếm vùng thông tin tương đương (paraphrased) trong bài đọc.';
    } else if (topReason.includes('False với Not Given')) {
      suggestionText = 'Chú ý: <strong>FALSE</strong> nghĩa là thông tin trong bài viết ngược/mâu thuẫn hoàn toàn với câu hỏi. <strong>NOT GIVEN</strong> nghĩa là đề không nhắc đến hoặc không thể khẳng định đúng/sai từ văn bản.';
    } else if (topReason.includes('chính tả')) {
      suggestionText = 'Hãy kiểm tra kỹ từng ký tự khi điền đáp án, chú ý dạng số nhiều/số ít (plurals) và viết hoa đúng mẫu tự yêu cầu.';
    } else if (topReason.includes('thời gian')) {
      suggestionText = 'Phân bổ thời gian gợi ý: Passage 1 làm trong tối đa 15 phút, Passage 2 là 20 phút, Passage 3 là 25 phút. Đừng sa đà quá lâu vào một câu hỏi khó.';
    } else if (topReason.includes('Audio')) {
      suggestionText = 'Dành thời gian đọc trước câu hỏi trong các khoảng nghỉ giữa các Section. Tập trung nghe các từ chuyển tiếp (signposting language) để đoán trước loại từ cần điền.';
    }

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div class="insights-box" style="background-color:rgba(239, 68, 68, 0.05);border-color:rgba(239,68,68,0.15)">
          <h4 style="color:var(--danger);display:flex;align-items:center;gap:6px;">
            <i data-lucide="alert-triangle"></i> Lỗ hổng lớn nhất hiện tại: ${topReason} (${topCount} lần làm sai)
          </h4>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:6px;">Phân tích chỉ ra rằng đây là lý do phổ biến nhất khiến bạn mất điểm trong các kỳ thi thử gần đây.</p>
        </div>

        <div class="insights-box">
          <h4 style="display:flex;align-items:center;gap:6px;">
            <i data-lucide="sparkles"></i> Gợi ý hành động khắc phục:
          </h4>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:6px;line-height:1.6;">${suggestionText}</p>
        </div>
      </div>
    `;
  }
};
