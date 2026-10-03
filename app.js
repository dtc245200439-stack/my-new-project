/* ==========================================================================
   NovaTask Workspace - Interactive Application Engine
   ========================================================================== */

// --- Default Data & State ---
const DEFAULT_TASKS = [
  {
    id: 'task-1',
    title: 'Thiết kế Giao diện NovaTask Dashboard',
    desc: 'Xây dựng UI phong cách Glassmorphism với Dark Mode và các hiệu ứng động.',
    category: 'UI/UX Design',
    priority: 'high',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'task-2',
    title: 'Tích hợp Pomodoro Focus Timer',
    desc: 'Phát triển bộ đếm thời gian tập trung 25 phút có vòng tiến trình SVG.',
    category: 'Feature',
    priority: 'high',
    status: 'in-progress',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'task-3',
    title: 'Viết báo cáo tổng quan dự án',
    desc: 'Tổng hợp tài liệu dự án, cấu trúc thư mục và hướng dẫn nộp bài.',
    category: 'Documentation',
    priority: 'medium',
    status: 'todo',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'task-4',
    title: 'Kiểm thử responsive trên Mobile & Tablet',
    desc: 'Đảm bảo giao diện tương thích tốt trên mọi thiết bị màn hình.',
    category: 'QA Testing',
    priority: 'low',
    status: 'review',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_NOTES = [
  {
    id: 'note-1',
    title: 'Ý tưởng tính năng tương lai 💡',
    content: 'Tích hợp AI Assistant tự động phân loại công việc và gợi ý lịch trình làm việc tối ưu.'
  },
  {
    id: 'note-2',
    title: 'Ghi chú cuộc họp team 📝',
    content: 'Đã hoàn thành kiểm thử giao diện. Chuẩn bị đưa nguồn code lên GitHub repository.'
  }
];

class NovaApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('novatask_tasks')) || DEFAULT_TASKS;
    this.notes = JSON.parse(localStorage.getItem('novatask_notes')) || DEFAULT_NOTES;
    this.theme = localStorage.getItem('novatask_theme') || 'dark';
    
    // Timer State
    this.timerMode = 'work'; // work (25m), shortBreak (5m), longBreak (15m)
    this.timerSeconds = 25 * 60;
    this.timerTotalSeconds = 25 * 60;
    this.timerInterval = null;
    this.isTimerRunning = false;

    this.init();
  }

  init() {
    this.applyTheme(this.theme);
    this.bindEvents();
    this.renderTasks();
    this.renderNotes();
    this.updateStats();
    this.initChart();
    this.updateTimerDisplay();
  }

  saveTasks() {
    localStorage.setItem('novatask_tasks', JSON.stringify(this.tasks));
    this.renderTasks();
    this.updateStats();
    this.drawChart();
  }

  saveNotes() {
    localStorage.setItem('novatask_notes', JSON.stringify(this.notes));
  }

  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('novatask_theme', theme);

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'dark' 
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    }
  }

  bindEvents() {
    // Navigation tabs
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.dataset.view;
        if (!targetView) return;

        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));

        item.classList.add('active');
        document.getElementById(`view-${targetView}`)?.classList.add('active');
      });
    });

    // Theme Toggle
    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
      this.applyTheme(this.theme === 'dark' ? 'light' : 'dark');
    });

    // Search Input Filter
    document.getElementById('taskSearchInput')?.addEventListener('input', (e) => {
      this.renderTasks(e.target.value.toLowerCase().trim());
    });

    // Modal Triggers
    const addTaskModal = document.getElementById('addTaskModal');
    document.getElementById('openAddTaskBtn')?.addEventListener('click', () => {
      addTaskModal?.classList.add('active');
    });
    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
      addTaskModal?.classList.remove('active');
    });

    // Form Submission
    document.getElementById('addTaskForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('taskTitleInput').value;
      const category = document.getElementById('taskCategoryInput').value;
      const priority = document.getElementById('taskPriorityInput').value;
      const desc = document.getElementById('taskDescInput').value;

      const newTask = {
        id: `task-${Date.now()}`,
        title,
        category,
        priority,
        desc,
        status: 'todo',
        createdAt: new Date().toISOString()
      };

      this.tasks.unshift(newTask);
      this.saveTasks();

      // Reset & close
      e.target.reset();
      addTaskModal?.classList.remove('active');
      this.showToast('✅ Đã thêm công việc mới thành công!');
    });

    // Pomodoro Controls
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setTimerMode(btn.dataset.mode);
      });
    });

    document.getElementById('startTimerBtn')?.addEventListener('click', () => this.toggleTimer());
    document.getElementById('resetTimerBtn')?.addEventListener('click', () => this.resetTimer());

    // Add Note Button
    document.getElementById('addNoteBtn')?.addEventListener('click', () => {
      const newNote = {
        id: `note-${Date.now()}`,
        title: 'Ghi chú mới',
        content: ''
      };
      this.notes.unshift(newNote);
      this.saveNotes();
      this.renderNotes();
    });

    // Export Data Button
    document.getElementById('exportDataBtn')?.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.tasks, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `novatask_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      this.showToast('📦 Đã xuất dữ liệu bài tập JSON thành công!');
    });
  }

  // --- Task Operations ---
  renderTasks(filterQuery = '') {
    const columns = {
      'todo': document.getElementById('col-todo'),
      'in-progress': document.getElementById('col-in-progress'),
      'review': document.getElementById('col-review'),
      'completed': document.getElementById('col-completed')
    };

    const counts = { 'todo': 0, 'in-progress': 0, 'review': 0, 'completed': 0 };

    Object.values(columns).forEach(col => {
      if (col) col.innerHTML = '';
    });

    this.tasks.forEach(task => {
      if (filterQuery && !task.title.toLowerCase().includes(filterQuery) && !task.category.toLowerCase().includes(filterQuery)) {
        return;
      }

      counts[task.status] = (counts[task.status] || 0) + 1;

      const card = document.createElement('div');
      card.className = 'task-card';
      card.draggable = true;

      const prioClass = `priority-${task.priority}`;

      card.innerHTML = `
        <span class="task-category">${task.category}</span>
        <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
        <p class="task-desc">${this.escapeHtml(task.desc || 'Không có mô tả')}</p>
        <div class="task-footer">
          <span class="priority-badge ${prioClass}">${task.priority.toUpperCase()}</span>
          <div class="task-actions">
            <button class="action-btn-sm move-btn" title="Chuyển trạng thái">➡️</button>
            <button class="action-btn-sm delete-btn" title="Xóa">🗑️</button>
          </div>
        </div>
      `;

      // Card event handlers
      card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.tasks = this.tasks.filter(t => t.id !== task.id);
        this.saveTasks();
        this.showToast('🗑️ Đã xóa công việc');
      });

      card.querySelector('.move-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const statuses = ['todo', 'in-progress', 'review', 'completed'];
        const nextIdx = (statuses.indexOf(task.status) + 1) % statuses.length;
        task.status = statuses[nextIdx];
        this.saveTasks();
        this.showToast(`🚀 Đã chuyển sang ${task.status.toUpperCase()}`);
      });

      if (columns[task.status]) {
        columns[task.status].appendChild(card);
      }
    });

    // Update Counts
    document.getElementById('count-todo').textContent = counts['todo'];
    document.getElementById('count-in-progress').textContent = counts['in-progress'];
    document.getElementById('count-review').textContent = counts['review'];
    document.getElementById('count-completed').textContent = counts['completed'];
  }

  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;
    const score = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('statTotalTasks').textContent = total;
    document.getElementById('statCompletedTasks').textContent = completed;
    document.getElementById('statPendingTasks').textContent = pending;
    document.getElementById('statProductivityScore').textContent = `${score}%`;

    const progressFill = document.getElementById('statProgressBar');
    if (progressFill) progressFill.style.width = `${score}%`;
  }

  // --- Pomodoro Timer Engine ---
  setTimerMode(mode) {
    this.timerMode = mode;
    this.isTimerRunning = false;
    clearInterval(this.timerInterval);

    if (mode === 'work') this.timerTotalSeconds = 25 * 60;
    else if (mode === 'shortBreak') this.timerTotalSeconds = 5 * 60;
    else if (mode === 'longBreak') this.timerTotalSeconds = 15 * 60;

    this.timerSeconds = this.timerTotalSeconds;
    this.updateTimerDisplay();
    document.getElementById('startTimerBtn').textContent = 'Bắt đầu';
  }

  toggleTimer() {
    const btn = document.getElementById('startTimerBtn');
    if (this.isTimerRunning) {
      clearInterval(this.timerInterval);
      this.isTimerRunning = false;
      btn.textContent = 'Tiếp tục';
    } else {
      this.isTimerRunning = true;
      btn.textContent = 'Tạm dừng';
      this.timerInterval = setInterval(() => {
        if (this.timerSeconds > 0) {
          this.timerSeconds--;
          this.updateTimerDisplay();
        } else {
          clearInterval(this.timerInterval);
          this.isTimerRunning = false;
          btn.textContent = 'Bắt đầu';
          this.showToast('⏰ Đã hết giờ làm việc Pomodoro!');
        }
      }, 1000);
    }
  }

  resetTimer() {
    this.setTimerMode(this.timerMode);
  }

  updateTimerDisplay() {
    const mins = Math.floor(this.timerSeconds / 60);
    const secs = this.timerSeconds % 60;
    const displayStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    document.getElementById('timerDigits').textContent = displayStr;

    // SVG Ring calculation (stroke-dasharray 690)
    const ring = document.getElementById('timerRingProgress');
    if (ring) {
      const offset = 690 - (this.timerSeconds / this.timerTotalSeconds) * 690;
      ring.style.strokeDashoffset = offset;
    }
  }

  // --- Quick Notes Engine ---
  renderNotes() {
    const container = document.getElementById('notesContainer');
    if (!container) return;

    container.innerHTML = '';
    this.notes.forEach(note => {
      const card = document.createElement('div');
      card.className = 'note-card';

      card.innerHTML = `
        <input type="text" class="note-title" value="${this.escapeHtml(note.title)}" placeholder="Tiêu đề...">
        <textarea class="note-body" placeholder="Nhập nội dung ghi chú...">${this.escapeHtml(note.content)}</textarea>
        <div style="display:flex; justify-content:flex-end;">
          <button class="action-btn-sm del-note-btn" style="color:var(--accent-rose)">Xóa ghi chú</button>
        </div>
      `;

      card.querySelector('.note-title').addEventListener('input', (e) => {
        note.title = e.target.value;
        this.saveNotes();
      });

      card.querySelector('.note-body').addEventListener('input', (e) => {
        note.content = e.target.value;
        this.saveNotes();
      });

      card.querySelector('.del-note-btn').addEventListener('click', () => {
        this.notes = this.notes.filter(n => n.id !== note.id);
        this.saveNotes();
        this.renderNotes();
        this.showToast('🗑️ Đã xóa ghi chú');
      });

      container.appendChild(card);
    });
  }

  // --- Canvas Productivity Chart ---
  initChart() {
    this.drawChart();
    window.addEventListener('resize', () => this.drawChart());
  }

  drawChart() {
    const canvas = document.getElementById('activityChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth);
    const height = (canvas.height = 220);

    ctx.clearRect(0, 0, width, height);

    // Days of week
    const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
    const values = [4, 7, 5, 9, 6, 8, 10]; // Simulated task completion metrics

    const padding = 35;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const stepX = chartWidth / (days.length - 1);

    // Grid lines
    ctx.strokeStyle = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Line Path
    ctx.beginPath();
    const points = values.map((val, idx) => {
      const x = padding + idx * stepX;
      const y = height - padding - (val / 12) * chartHeight;
      return { x, y };
    });

    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Gradient fill under line
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    ctx.lineTo(points[points.length - 1].x, height - padding);
    ctx.lineTo(points[0].x, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Dots & Labels
    points.forEach((pt, i) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Labels
      ctx.fillStyle = this.theme === 'dark' ? '#9ca3af' : '#475569';
      ctx.font = '12px Plus Jakarta Sans';
      ctx.textAlign = 'center';
      ctx.fillText(days[i], pt.x, height - 10);
    });
  }

  // --- Utilities ---
  showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, match => {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
    });
  }
}

// Instantiate App on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.novaApp = new NovaApp();
});
