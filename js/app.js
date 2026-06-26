/* ==========================================================================
   APP ROUTER & COORDINATOR (SPA Manager with JWT auth validation)
   ========================================================================== */

// Global toast notifier helper
window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';
  if (type === 'warning') iconName = 'alert-circle';

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  lucide.createIcons();

  // Slide-in and out timer
  setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// Global modal helpers
window.showModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    if (id === 'settings-modal') {
      const user = AppState.getUser();
      document.getElementById('setting-username').value = user.username || '';
      document.getElementById('setting-target').value = user.targetBand || '6.5';
      document.getElementById('setting-study-hours').value = user.studyHours || 1.5;
    }
  }
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
};

document.addEventListener('DOMContentLoaded', async () => {
  // Bind Login/Register form actions regardless of authentication state
  bindAuthForms();

  // 1. JWT Session Check
  if (!AppState.isLoggedIn()) {
    window.showModal('auth-modal');
  } else {
    await initApp();
  }
});

// Core app initialization (can be called after login too)
async function initApp() {
  window.closeModal('auth-modal');

  // Load state caches from backend server
  window.showToast('Đang đồng bộ dữ liệu từ đám mây...', 'info');
  await AppState.loadAllDataFromServer();

  // 2. Pre-seed vocabulary from mockData if database is empty on server
  const currentVocab = AppState.getVocabularies();
  if (currentVocab.length === 0) {
    console.log('Pre-seeding mock vocabulary...');
    MockIELTSData.vocabulary.forEach(word => AppState.saveVocabulary(word));
  }

  // 3. Render Profile Card
  updateProfileUI();

  // 4. Bind Theme Toggle Actions (only bind once)
  if (!document._themeInitialized) {
    document._themeInitialized = true;
    initTheme();
  }

  // 5. Bind Navigation Events (only bind once)
  if (!document._navInitialized) {
    document._navInitialized = true;
    window.addEventListener('hashchange', handleRouting);
    bindNavigationElements();
  }

  // 6. Init global search event (only bind once)
  if (!document._searchInitialized) {
    document._searchInitialized = true;
    const globalSearch = document.getElementById('global-search');
    globalSearch.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (query.length > 0) {
        if (window.location.hash !== '#vocabulary') {
          window.location.hash = `#vocabulary?search=${encodeURIComponent(query)}`;
        } else {
          const ev = new CustomEvent('vocabularySearch', { detail: query });
          document.dispatchEvent(ev);
        }
      }
    });
  }

  // 7. Bind Modals Forms (only bind once)
  if (!document._formsInitialized) {
    document._formsInitialized = true;
    initForms();
  }

  // 8. Run initial route loading
  window.location.hash = '#dashboard';
  handleRouting();
  
  // 9. Render online connection badge
  updateSyncStatusUI(true);
}


// Update profile elements in DOM
function updateProfileUI() {
  const user = AppState.getUser();
  document.getElementById('profile-name').textContent = user.username;
  document.getElementById('profile-target').textContent = `Target: ${user.targetBand}`;
  document.getElementById('streak-count').textContent = `${user.streak || 0} ngày`;
  
  const avatar = document.querySelector('.user-avatar');
  if (avatar && user.username) avatar.textContent = user.username.charAt(0).toUpperCase();
}

// Track state updates
document.addEventListener('userStateChange', () => {
  updateProfileUI();
});

// Theme Management
function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('app_theme') || 'dark';

  if (savedTheme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  }

  toggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('dark-theme')) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      localStorage.setItem('app_theme', 'light');
      window.showToast('Đã đổi sang giao diện Sáng', 'info');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      localStorage.setItem('app_theme', 'dark');
      window.showToast('Đã đổi sang giao diện Tối', 'info');
    }
  });
}

// Form binding
function initForms() {
  // 1. Settings profile Form
  const settingsForm = document.getElementById('settings-form');
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('setting-username').value;
    const targetBand = document.getElementById('setting-target').value;
    const studyHours = parseFloat(document.getElementById('setting-study-hours').value);

    AppState.saveUser({ username, targetBand, studyHours });
    window.closeModal('settings-modal');
    window.showToast('Cập nhật cấu hình thành công!');
  });

  // 2. GLOBAL Word-form submit handler (works from ANY page: Cambridge, Dashboard, etc.)
  const wordForm = document.getElementById('word-form');
  wordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('vocab-id').value || null;
    const word = document.getElementById('vocab-word').value;
    const ipa = document.getElementById('vocab-ipa').value;
    const meaningVi = document.getElementById('vocab-meaning-vi').value;
    const meaningEn = document.getElementById('vocab-meaning-en').value;
    const partOfSpeech = document.getElementById('vocab-part-of-speech').value;
    const topic = document.getElementById('vocab-topic').value;
    const difficulty = document.getElementById('vocab-level').value;
    const source = document.getElementById('vocab-source').value;
    const status = document.getElementById('vocab-status').value;
    const example = document.getElementById('vocab-example').value;

    AppState.saveVocabulary({
      id, word, ipa, meaningVi, meaningEn, partOfSpeech, topic, difficulty, source, status, example
    });

    window.closeModal('word-modal');
    window.showToast(id ? 'Cập nhật từ vựng thành công!' : '✅ Thêm từ vựng mới thành công!');

    // If VocabularyModule table is currently visible, refresh it
    const vocabTableBody = document.getElementById('vocab-table-body');
    if (vocabTableBody && typeof VocabularyModule !== 'undefined') {
      VocabularyModule.renderTableRows();
    }
  });

  // 3. GLOBAL Import-form submit handler
  const importForm = document.getElementById('import-form');
  importForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawText = document.getElementById('import-text').value;
    
    if (typeof VocabularyModule !== 'undefined') {
      const parsed = VocabularyModule.parseCSVText(rawText);
      if (parsed.length === 0) {
        window.showToast('Không thể parse dữ liệu. Vui lòng kiểm tra định dạng!', 'error');
        return;
      }
      const imported = AppState.bulkImportVocabulary(parsed);
      window.closeModal('import-modal');
      window.showToast(`Import thành công ${imported} từ vựng mới!`);

      const vocabTableBody = document.getElementById('vocab-table-body');
      if (vocabTableBody) VocabularyModule.renderTableRows();
      importForm.reset();
    }
  });

  // Danger Reset button
  const resetBtn = document.getElementById('reset-all-data-btn');
  resetBtn.addEventListener('click', () => {
    if (confirm('CẢNH BÁO: Thao tác này sẽ đăng xuất và xóa toàn bộ cache dữ liệu trên thiết bị.')) {
      AppState.resetAllData();
    }
  });

  // User Card click opens Settings
  document.getElementById('profile-trigger').addEventListener('click', (e) => {
    if (!e.target.closest('#nav-settings')) {
      window.showModal('settings-modal');
    }
  });
  
  document.getElementById('nav-settings').addEventListener('click', () => {
    window.showModal('settings-modal');
  });
}

// Register & Login forms coordinate binding
function bindAuthForms() {
  let isLoginMode = true;
  const toggleLink = document.getElementById('auth-toggle-link');
  const authForm = document.getElementById('auth-form');
  
  if (!toggleLink || !authForm) return;

  toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const submitBtn = document.getElementById('auth-submit-btn');
    const emailGroup = document.getElementById('auth-email-group');
    const emailInput = document.getElementById('auth-email');

    if (isLoginMode) {
      title.textContent = 'Đăng nhập IELTS Hub';
      subtitle.textContent = 'Vui lòng đăng nhập để bắt đầu học tập';
      submitBtn.textContent = 'Đăng nhập';
      emailGroup.style.display = 'none';
      emailInput.removeAttribute('required');
      toggleLink.textContent = 'Chưa có tài khoản? Đăng ký ngay';
    } else {
      title.textContent = 'Đăng ký tài khoản';
      subtitle.textContent = 'Tạo tài khoản mới để lưu tiến độ học tập';
      submitBtn.textContent = 'Đăng ký tài khoản';
      emailGroup.style.display = 'block';
      emailInput.setAttribute('required', 'true');
      toggleLink.textContent = 'Đã có tài khoản? Đăng nhập';
    }
  });

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    const email = document.getElementById('auth-email').value.trim();

    window.showToast(isLoginMode ? 'Đang xác thực đăng nhập...' : 'Đang khởi tạo tài khoản...', 'info');

    let result;
    if (isLoginMode) {
      result = await AppState.login(username, password);
    } else {
      result = await AppState.register(username, email, password);
    }

    if (result.success) {
      window.closeModal('auth-modal');
      window.showToast(isLoginMode ? '🎉 Đăng nhập thành công!' : '🎉 Đăng ký tài khoản thành công!');
      
      // Initialize app without full page reload
      await initApp();
    } else {
      window.showToast(result.error || 'Có lỗi xảy ra trong quá trình xác thực!', 'error');
    }
  });
}

// Real-time Cloud Sync Status Badge indicator in header
function updateSyncStatusUI(active) {
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;

  let syncBadge = document.getElementById('cloud-sync-badge');
  if (!syncBadge) {
    syncBadge = document.createElement('div');
    syncBadge.id = 'cloud-sync-badge';
    syncBadge.className = 'streak-badge';
    syncBadge.style.color = 'var(--success)';
    syncBadge.style.borderColor = 'rgba(16, 185, 129, 0.2)';
    syncBadge.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
    syncBadge.style.display = 'none';
    syncBadge.title = "Dữ liệu được lưu trữ trên PostgreSQL Cloud";
    
    const toggleBtn = document.getElementById('theme-toggle');
    headerActions.insertBefore(syncBadge, toggleBtn);
  }

  if (active) {
    syncBadge.innerHTML = `<i data-lucide="cloud"></i> <span style="font-size:0.75rem; font-weight:600;">Đã đồng bộ</span>`;
    syncBadge.style.display = 'flex';
  } else {
    syncBadge.style.display = 'none';
  }
  lucide.createIcons();
}

// SPA Routing Controller
function handleRouting() {
  const hashString = window.location.hash || '#dashboard';
  const cleanHash = hashString.split('?')[0];
  const queryParams = parseQueryParams(hashString);
  
  const viewport = document.getElementById('main-content');
  if (!viewport) return;

  // Add view change animations
  viewport.className = 'app-content-viewport';
  void viewport.offsetWidth; 
  viewport.classList.add('fade-in-view');

  // Highlight menu links
  updateSidebarHighlight(cleanHash);

  // Router dispatcher
  if (cleanHash === '#dashboard') {
    DashboardModule.render(viewport);
  } else if (cleanHash === '#vocabulary') {
    VocabularyModule.render(viewport, queryParams);
  } else if (cleanHash === '#quiz') {
    QuizModule.render(viewport);
  } else if (cleanHash === '#cambridge') {
    CambridgeModule.render(viewport, queryParams);
  } else if (cleanHash === '#mistakes') {
    MistakesModule.render(viewport);
  } else if (cleanHash === '#analytics') {
    AnalyticsModule.render(viewport);
  } else if (cleanHash === '#planner') {
    PlannerModule.render(viewport);
  } else {
    DashboardModule.render(viewport);
  }

  lucide.createIcons();
}

function parseQueryParams(hashString) {
  const result = {};
  if (!hashString.includes('?')) return result;
  
  const queryStr = hashString.split('?')[1];
  const pairs = queryStr.split('&');
  
  pairs.forEach(pair => {
    const parts = pair.split('=');
    if (parts[0]) {
      result[parts[0]] = decodeURIComponent(parts[1] || '');
    }
  });
  
  return result;
}

function updateSidebarHighlight(hash) {
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    const itemHash = item.getAttribute('href').split('?')[0];
    if (itemHash === hash) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function bindNavigationElements() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href.startsWith('#')) {
        // Hash routing handled by event listener automatically
      }
    });
  });
}
