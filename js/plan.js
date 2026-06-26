/* ==========================================================================
   STUDY PLANNER MODULE (Weekly calendar & task manager)
   ========================================================================== */

const PlannerModule = {
  selectedDayId: 'mon', // Default to Monday

  render(container) {
    this.container = container;
    this.renderPlanner();
  },

  renderPlanner() {
    const plans = AppState.getPlans();
    
    // Set selectedDayId to today if first render
    const daysMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const todayIndex = new Date().getDay();
    const todayId = daysMap[todayIndex];
    if (this.selectedDayId === 'mon' && plans.some(p => p.id === todayId)) {
      this.selectedDayId = todayId;
    }

    const activePlan = plans.find(p => p.id === this.selectedDayId);

    this.container.innerHTML = `
      <div class="vocabulary-layout">
        
        <!-- Module Header -->
        <div class="view-header">
          <div class="view-header-title">
            <h1>Kế hoạch học tập tuần</h1>
            <p>Xây dựng thói quen tự học IELTS kỷ luật mỗi ngày theo lịch trình gợi ý.</p>
          </div>
        </div>

        <div class="planner-layout">
          
          <!-- Left Calendar Day Selectors -->
          <div class="weekly-calendar">
            ${plans.map(p => {
              const hasUnfinishedSub = p.subtasks && p.subtasks.some(s => !s.completed);
              let icon = 'circle';
              let color = 'var(--text-muted)';
              if (p.completed) {
                icon = 'check-circle';
                color = 'var(--success)';
              } else if (hasUnfinishedSub) {
                icon = 'alert-circle';
                color = 'var(--warning)';
              }

              return `
                <div class="calendar-day-card ${p.id === this.selectedDayId ? 'active' : ''}" onclick="PlannerModule.selectDay('${p.id}')">
                  <div>
                    <span class="day-name">${p.day}</span>
                    <p style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                      ${p.task}
                    </p>
                  </div>
                  <i data-lucide="${icon}" style="width:18px;height:18px;color:${color};flex-shrink:0;"></i>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Right Day Tasks Dashboard -->
          <div class="card day-details-panel">
            <div class="card-header-actions">
              <div>
                <h2 style="font-weight:700;">Chi tiết kế hoạch: ${activePlan.day}</h2>
                <p style="font-size:0.8rem;color:var(--text-muted)">Nhiệm vụ chính được phân bổ</p>
              </div>
              <button class="btn ${activePlan.completed ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="PlannerModule.toggleMainTask('${activePlan.id}')">
                <i data-lucide="${activePlan.completed ? 'check-square' : 'square'}"></i> 
                ${activePlan.completed ? 'Đã hoàn thành chính' : 'Đánh dấu xong chính'}
              </button>
            </div>

            <!-- Main Task visual display -->
            <div style="background-color:var(--bg-primary);padding:18px 24px;border-radius:var(--radius-md);border:1px solid var(--border-color);margin-bottom:12px;">
              <h3 style="font-size:1.1rem;color:var(--primary);">${activePlan.task}</h3>
            </div>

            <!-- Custom Todo Checklist Checklist -->
            <div>
              <h3 style="font-size:1rem;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
                <i data-lucide="check-square" style="color:var(--primary);width:20px;height:20px;"></i> Danh sách việc cần làm (Checklist)
              </h3>
              
              <div class="todo-list-container" id="planner-todo-list">
                <!-- Dynamically populated -->
              </div>

              <!-- Input to add custom checklists -->
              <div style="margin-top:20px;display:flex;gap:12px;">
                <input type="text" class="exam-text-input" id="new-todo-input" placeholder="Ví dụ: Luyện thêm 5 flashcards từ khó..." style="flex-grow:1;background-color:var(--bg-primary);">
                <button class="btn btn-primary" onclick="PlannerModule.addTodoItem()" style="padding:10px 16px;">
                  Thêm việc
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;

    this.renderTodoItems(activePlan);
    lucide.createIcons();
    
    // Bind enter key on new-todo-input
    const inp = document.getElementById('new-todo-input');
    if (inp) {
      inp.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') this.addTodoItem();
      });
    }
  },

  selectDay(id) {
    this.selectedDayId = id;
    this.renderPlanner();
  },

  toggleMainTask(id) {
    AppState.togglePlanTask(id);
    this.renderPlanner();
    window.showToast('Đã cập nhật nhiệm vụ chính!');
  },

  renderTodoItems(activePlan) {
    const listContainer = document.getElementById('planner-todo-list');
    if (!listContainer) return;

    // Check if subtasks exist. If not, generate standard baseline default subtasks
    if (!activePlan.subtasks) {
      activePlan.subtasks = [
        { id: 'sub_1', text: 'Ôn 15 từ vựng hôm nay (Flashcards)', completed: false },
        { id: 'sub_2', text: 'Thực hiện luyện tập đề tương ứng', completed: false },
        { id: 'sub_3', text: 'Xem lại tối thiểu 2 câu trong sổ lỗi sai', completed: false }
      ];
      const plans = AppState.getPlans();
      const pIdx = plans.findIndex(p => p.id === activePlan.id);
      plans[pIdx] = activePlan;
      AppState.savePlan(plans);
    }

    if (activePlan.subtasks.length === 0) {
      listContainer.innerHTML = `<p style="font-size:0.85rem;color:var(--text-muted);text-align:center;padding:12px;">Checklist đang trống. Hãy thêm việc cần làm phía dưới.</p>`;
      return;
    }

    listContainer.innerHTML = activePlan.subtasks.map(sub => `
      <div class="todo-item ${sub.completed ? 'completed' : ''}" onclick="PlannerModule.toggleTodoItem('${sub.id}')">
        <div class="todo-checkbox">
          ${sub.completed ? '<i data-lucide="check" style="width:14px;height:14px;"></i>' : ''}
        </div>
        <span class="todo-text">${sub.text}</span>
        
        <!-- Delete subtask button -->
        <button onclick="event.stopPropagation(); PlannerModule.deleteTodoItem('${sub.id}')" style="background:none;border:none;margin-left:auto;color:var(--text-muted);cursor:pointer;" title="Xóa">
          <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
        </button>
      </div>
    `).join('');

    lucide.createIcons();
  },

  toggleTodoItem(subId) {
    const plans = AppState.getPlans();
    const activePlan = plans.find(p => p.id === this.selectedDayId);
    
    if (activePlan && activePlan.subtasks) {
      const sub = activePlan.subtasks.find(s => s.id === subId);
      if (sub) {
        sub.completed = !sub.completed;
        
        // Auto-check: if all subtasks are finished, offer to complete main task
        const allDone = activePlan.subtasks.every(s => s.completed);
        if (allDone && !activePlan.completed) {
          activePlan.completed = true;
          window.showToast('Chúc mừng bạn đã hoàn thành tất cả công việc hôm nay!');
        }

        AppState.savePlan(plans);
        this.renderPlanner();
      }
    }
  },

  addTodoItem() {
    const input = document.getElementById('new-todo-input');
    const val = input.value.trim();

    if (!val) return;

    const plans = AppState.getPlans();
    const activePlan = plans.find(p => p.id === this.selectedDayId);

    if (activePlan) {
      if (!activePlan.subtasks) activePlan.subtasks = [];
      
      activePlan.subtasks.push({
        id: 'sub_' + Date.now(),
        text: val,
        completed: false
      });

      AppState.savePlan(plans);
      input.value = '';
      this.renderPlanner();
      window.showToast('Đã thêm công việc vào Checklist!');
    }
  },

  deleteTodoItem(subId) {
    const plans = AppState.getPlans();
    const activePlan = plans.find(p => p.id === this.selectedDayId);

    if (activePlan && activePlan.subtasks) {
      activePlan.subtasks = activePlan.subtasks.filter(s => s.id !== subId);
      AppState.savePlan(plans);
      this.renderPlanner();
      window.showToast('Đã xóa công việc khỏi Checklist.', 'error');
    }
  }
};
