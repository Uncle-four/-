/**
 * 自我管理应用 - 完整版
 * 功能：任务管理、文档库、AI助手、飞书集成、成就系统
 * 作者：AI Assistant
 * 日期：2026-07-06
 */

// ==================== 常量定义 ====================
const APP_CONFIG = {
  version: '1.0.0',
  storageKeys: {
    tasks: 'self_manage_tasks',
    documents: 'self_manage_documents',
    settings: 'self_manage_settings',
    achievements: 'self_manage_achievements',
    dailyRecords: 'self_manage_daily_records'
  },
  boards: [
    { id: 'speech', name: '口才训练', icon: '🎤', color: '#FF6B6B' },
    { id: 'professional', name: '专业沉淀', icon: '📚', color: '#4ECDC4' },
    { id: 'fitness', name: '运动健身', icon: '💪', color: '#95E1D3' },
    { id: 'thinking', name: '思维训练', icon: '🧠', color: '#F38181' }
  ],
  achievementTypes: [
    { id: 'first_complete', name: '初出茅庐', desc: '完成第一个任务', condition: (stats) => stats.totalCompleted >= 1 },
    { id: 'streak_3', name: '坚持不懈', desc: '连续打卡3天', condition: (stats) => stats.maxStreak >= 3 },
    { id: 'streak_7', name: '周周向上', desc: '连续打卡7天', condition: (stats) => stats.maxStreak >= 7 },
    { id: 'streak_30', name: '月度冠军', desc: '连续打卡30天', condition: (stats) => stats.maxStreak >= 30 },
    { id: 'complete_50', name: '小有成就', desc: '完成50个任务', condition: (stats) => stats.totalCompleted >= 50 },
    { id: 'complete_100', name: '百炼成钢', desc: '完成100个任务', condition: (stats) => stats.totalCompleted >= 100 },
    { id: 'complete_500', name: '大师之路', desc: '完成500个任务', condition: (stats) => stats.totalCompleted >= 500 },
    { id: 'first_doc', name: '知识起步', desc: '创建第一篇文档', condition: (stats) => stats.totalDocs >= 1 },
    { id: 'doc_10', name: '知识库构建者', desc: '创建10篇文档', condition: (stats) => stats.totalDocs >= 10 }
  ],
  colorSchemes: [
    { id: 'default', name: '默认蓝', primary: '#4A90E2' },
    { id: 'purple', name: '优雅紫', primary: '#9B59B6' },
    { id: 'green', name: '清新绿', primary: '#27AE60' },
    { id: 'orange', name: '活力橙', primary: '#F39C12' },
    { id: 'pink', name: '浪漫粉', primary: '#E91E63' }
  ]
};

// ==================== 数据管理模块 ====================
const DataManager = {
  // 获取数据
  get(key) {
    try {
      const data = localStorage.getItem(APP_CONFIG.storageKeys[key]);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('读取数据失败:', e);
      return null;
    }
  },

  // 保存数据
  set(key, data) {
    try {
      localStorage.setItem(APP_CONFIG.storageKeys[key], JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('保存数据失败:', e);
      return false;
    }
  },

  // 初始化默认数据
  initDefaultData() {
    // 初始化任务数据
    if (!this.get('tasks')) {
      const defaultTasks = [];
      APP_CONFIG.boards.forEach(board => {
        defaultTasks.push({
          id: `task_${board.id}_1`,
          boardId: board.id,
          title: `示例任务 - ${board.name}`,
          description: '这是一个示例任务，点击完成按钮开始您的成长之旅',
          completed: false,
          createdAt: new Date().toISOString(),
          completedAt: null
        });
      });
      this.set('tasks', defaultTasks);
    }

    // 初始化文档数据
    if (!this.get('documents')) {
      this.set('documents', []);
    }

    // 初始化设置
    if (!this.get('settings')) {
      this.set('settings', {
        theme: 'light',
        colorScheme: 'default',
        reminderTime: '09:00',
        feishuWebhook: '',
        autoSync: false
      });
    }

    // 初始化成就
    if (!this.get('achievements')) {
      this.set('achievements', []);
    }

    // 初始化每日记录
    if (!this.get('dailyRecords')) {
      this.set('dailyRecords', {});
    }
  },

  // 获取今日任务
  getTodayTasks() {
    const tasks = this.get('tasks') || [];
    const today = new Date().toDateString();

    return tasks.map(task => {
      const taskDate = task.completedAt ? new Date(task.completedAt).toDateString() : null;
      return {
        ...task,
        completedToday: taskDate === today && task.completed
      };
    });
  },

  // 获取今日完成率
  getTodayCompletionRate() {
    const tasks = this.getTodayTasks();
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completedToday).length;
    return Math.round((completed / tasks.length) * 100);
  },

  // 获取统计数据
  getStatistics() {
    const tasks = this.get('tasks') || [];
    const documents = this.get('documents') || [];
    const dailyRecords = this.get('dailyRecords') || {};
    const achievements = this.get('achievements') || [];

    const totalCompleted = tasks.filter(t => t.completed).length;
    const totalDocs = documents.length;

    // 计算连续打卡
    let currentStreak = 0;
    let maxStreak = 0;
    const sortedDates = Object.keys(dailyRecords).sort().reverse();

    for (let i = 0; i < sortedDates.length; i++) {
      const date = new Date(sortedDates[i]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);

      if (date.toDateString() === expectedDate.toDateString() && dailyRecords[sortedDates[i]] > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        break;
      }
    }

    // 本周完成率
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    let weekTotal = 0;
    let weekCompleted = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toDateString();
      if (dailyRecords[dateStr]) {
        weekTotal += tasks.length;
        weekCompleted += dailyRecords[dateStr];
      }
    }

    return {
      totalCompleted,
      totalDocs,
      currentStreak,
      maxStreak,
      weekCompletionRate: weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0,
      achievementsUnlocked: achievements.length
    };
  },

  // 获取近7天数据
  getLast7DaysData() {
    const dailyRecords = this.get('dailyRecords') || {};
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const tasks = this.get('tasks') || [];
      const total = tasks.length;
      const completed = dailyRecords[dateStr] || 0;

      data.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        day: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
        total,
        completed,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0
      });
    }

    return data;
  },

  // 更新任务状态
  toggleTask(taskId) {
    const tasks = this.get('tasks') || [];
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;

    this.set('tasks', tasks);

    // 更新每日记录
    if (task.completed) {
      const today = new Date().toDateString();
      const dailyRecords = this.get('dailyRecords') || {};
      dailyRecords[today] = (dailyRecords[today] || 0) + 1;
      this.set('dailyRecords', dailyRecords);
    }

    return task;
  },

  // 添加任务
  addTask(boardId, title, description = '') {
    const tasks = this.get('tasks') || [];
    const newTask = {
      id: `task_${Date.now()}`,
      boardId,
      title,
      description,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    tasks.push(newTask);
    this.set('tasks', tasks);
    return newTask;
  },

  // 删除任务
  deleteTask(taskId) {
    let tasks = this.get('tasks') || [];
    tasks = tasks.filter(t => t.id !== taskId);
    this.set('tasks', tasks);
  },

  // 添加文档
  addDocument(doc) {
    const documents = this.get('documents') || [];
    const newDoc = {
      id: `doc_${Date.now()}`,
      ...doc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    documents.push(newDoc);
    this.set('documents', documents);
    return newDoc;
  },

  // 更新文档
  updateDocument(docId, updates) {
    const documents = this.get('documents') || [];
    const index = documents.findIndex(d => d.id === docId);
    if (index === -1) return null;

    documents[index] = {
      ...documents[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.set('documents', documents);
    return documents[index];
  },

  // 删除文档
  deleteDocument(docId) {
    let documents = this.get('documents') || [];
    documents = documents.filter(d => d.id !== docId);
    this.set('documents', documents);
  },

  // 检查并解锁成就
  checkAchievements() {
    const stats = this.getStatistics();
    const achievements = this.get('achievements') || [];
    const newAchievements = [];

    APP_CONFIG.achievementTypes.forEach(achievement => {
      if (!achievements.includes(achievement.id) && achievement.condition(stats)) {
        achievements.push(achievement.id);
        newAchievements.push(achievement);
      }
    });

    if (newAchievements.length > 0) {
      this.set('achievements', achievements);
    }

    return newAchievements;
  }
};

// ==================== UI组件模块 ====================
const UI = {
  // Toast提示
  toast: {
    show(message, type = 'info', duration = 3000) {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span class="toast-message">${message}</span>
      `;

      const container = document.getElementById('toast-container') || (() => {
        const c = document.createElement('div');
        c.id = 'toast-container';
        document.body.appendChild(c);
        return c;
      })();

      container.appendChild(toast);

      setTimeout(() => toast.classList.add('show'), 10);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  },

  // 弹窗管理
  modal: {
    show(options) {
      const { title, content, onConfirm, onCancel, confirmText = '确定', cancelText = '取消' } = options;

      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <h3>${title}</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">${content}</div>
          <div class="modal-footer">
            ${onCancel ? `<button class="btn btn-secondary modal-cancel">${cancelText}</button>` : ''}
            ${onConfirm ? `<button class="btn btn-primary modal-confirm">${confirmText}</button>` : ''}
          </div>
        </div>
      `;

      modal.querySelector('.modal-close').onclick = () => this.hide(modal);
      if (onCancel) {
        modal.querySelector('.modal-cancel').onclick = () => {
          onCancel();
          this.hide(modal);
        };
      }
      if (onConfirm) {
        modal.querySelector('.modal-confirm').onclick = () => {
          onConfirm();
          this.hide(modal);
        };
      }

      modal.onclick = (e) => {
        if (e.target === modal) this.hide(modal);
      };

      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add('show'), 10);

      return modal;
    },

    hide(modal) {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    }
  },

  // 确认对话框
  confirm(message) {
    return new Promise((resolve) => {
      this.modal.show({
        title: '确认',
        content: `<p>${message}</p>`,
        confirmText: '确定',
        cancelText: '取消',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  },

  // 输入对话框
  prompt(title, placeholder = '', defaultValue = '') {
    return new Promise((resolve) => {
      const modal = this.modal.show({
        title,
        content: `<input type="text" class="input" id="prompt-input" placeholder="${placeholder}" value="${defaultValue}">`,
        confirmText: '确定',
        cancelText: '取消',
        onConfirm: () => resolve(modal.querySelector('#prompt-input').value),
        onCancel: () => resolve(null)
      });
    });
  }
};

// ==================== 路由管理模块 ====================
const Router = {
  currentPage: 'dashboard',
  pageHistory: [],

  init() {
    // 监听hash变化
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1) || 'dashboard';
      this.navigate(hash, false);
    });

    // 初始加载
    const hash = window.location.hash.slice(1) || 'dashboard';
    this.navigate(hash, false);
  },

  navigate(page, pushHistory = true) {
    if (pushHistory) {
      this.pageHistory.push(this.currentPage);
    }

    this.currentPage = page;
    window.location.hash = page;

    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // 渲染页面
    this.renderPage(page);
  },

  renderPage(page) {
    const mainContent = document.getElementById('main-content');
    mainContent.classList.add('page-transition');

    setTimeout(() => {
      switch (page) {
        case 'dashboard':
          Dashboard.render();
          break;
        case 'today':
          Today.render();
          break;
        case 'library':
          Library.render();
          break;
        case 'ai-assist':
          AIAssist.render();
          break;
        case 'settings':
          Settings.render();
          break;
        default:
          // 板块详情页
          if (page.startsWith('board-')) {
            const boardId = page.replace('board-', '');
            BoardDetail.render(boardId);
          }
      }
      mainContent.classList.remove('page-transition');
    }, 200);
  },

  back() {
    if (this.pageHistory.length > 0) {
      const previousPage = this.pageHistory.pop();
      this.navigate(previousPage, false);
    }
  }
};

// ==================== 主题管理模块 ====================
const ThemeManager = {
  apply() {
    const settings = DataManager.get('settings');
    const theme = settings?.theme || 'light';
    const colorScheme = APP_CONFIG.colorSchemes.find(c => c.id === (settings?.colorScheme || 'default'));

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--primary-color', colorScheme.primary);
  },

  toggle() {
    const settings = DataManager.get('settings');
    settings.theme = settings.theme === 'light' ? 'dark' : 'light';
    DataManager.set('settings', settings);
    this.apply();
    return settings.theme;
  },

  setColorScheme(schemeId) {
    const settings = DataManager.get('settings');
    settings.colorScheme = schemeId;
    DataManager.set('settings', settings);
    this.apply();
  }
};

// ==================== 页面：数据看板 ====================
const Dashboard = {
  render() {
    const stats = DataManager.getStatistics();
    const todayRate = DataManager.getTodayCompletionRate();
    const last7Days = DataManager.getLast7DaysData();
    const achievements = DataManager.get('achievements') || [];

    const hour = new Date().getHours();
    let greeting = '早上好';
    if (hour >= 12 && hour < 18) greeting = '下午好';
    else if (hour >= 18) greeting = '晚上好';

    document.getElementById('main-content').innerHTML = `
      <div class="dashboard-page">
        <div class="greeting-section">
          <h1>${greeting}，成长者！</h1>
          <p class="subtitle">每一天都是进步的机会</p>
        </div>

        <div class="progress-ring-section">
          <div class="progress-ring">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e0e0e0" stroke-width="8"/>
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--primary-color)" stroke-width="8"
                stroke-dasharray="${todayRate * 3.39} 339" stroke-linecap="round"
                transform="rotate(-90 60 60)"/>
            </svg>
            <div class="progress-text">
              <span class="rate">${todayRate}%</span>
              <span class="label">今日完成</span>
            </div>
          </div>
        </div>

        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-content">
              <div class="stat-value">${stats.currentStreak}</div>
              <div class="stat-label">连续打卡</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value">${stats.weekCompletionRate}%</div>
              <div class="stat-label">本周完成率</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-value">${stats.totalCompleted}</div>
              <div class="stat-label">累计完成</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-content">
              <div class="stat-value">${stats.achievementsUnlocked}</div>
              <div class="stat-label">成就解锁</div>
            </div>
          </div>
        </div>

        <div class="chart-section">
          <h2>近7天趋势</h2>
          <div class="bar-chart">
            ${last7Days.map(day => `
              <div class="bar-item">
                <div class="bar-container">
                  <div class="bar" style="height: ${day.rate}%"></div>
                </div>
                <div class="bar-label">${day.day}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="board-progress-section">
          <h2>各板块进度</h2>
          ${APP_CONFIG.boards.map(board => {
            const tasks = (DataManager.get('tasks') || []).filter(t => t.boardId === board.id);
            const completed = tasks.filter(t => t.completed).length;
            const rate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
            return `
              <div class="board-progress-item" onclick="Router.navigate('board-${board.id}')">
                <div class="board-header">
                  <span class="board-icon">${board.icon}</span>
                  <span class="board-name">${board.name}</span>
                  <span class="board-rate">${rate}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${rate}%; background: ${board.color}"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="achievement-section">
          <h2>成就墙</h2>
          <div class="achievement-grid">
            ${APP_CONFIG.achievementTypes.map(achievement => `
              <div class="achievement-item ${achievements.includes(achievement.id) ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievements.includes(achievement.id) ? '🏅' : '🔒'}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
};

// ==================== 页面：今日任务 ====================
const Today = {
  currentView: 'kanban',

  render() {
    document.getElementById('main-content').innerHTML = `
      <div class="today-page">
        <div class="view-toggle">
          <button class="view-btn ${this.currentView === 'kanban' ? 'active' : ''}" data-view="kanban">看板</button>
          <button class="view-btn ${this.currentView === 'list' ? 'active' : ''}" data-view="list">列表</button>
          <button class="view-btn ${this.currentView === 'timeline' ? 'active' : ''}" data-view="timeline">时间轴</button>
        </div>

        <div class="quick-add">
          <input type="text" id="quick-add-input" placeholder="快速添加任务...">
          <select id="quick-add-board">
            ${APP_CONFIG.boards.map(b => `<option value="${b.id}">${b.icon} ${b.name}</option>`).join('')}
          </select>
          <button id="quick-add-btn">添加</button>
        </div>

        <div id="tasks-container"></div>
      </div>
    `;

    this.renderTasks();
    this.bindEvents();
  },

  renderTasks() {
    const tasks = DataManager.getTodayTasks();
    const container = document.getElementById('tasks-container');

    if (this.currentView === 'kanban') {
      container.innerHTML = `
        <div class="kanban-view">
          ${APP_CONFIG.boards.map(board => {
            const boardTasks = tasks.filter(t => t.boardId === board.id);
            return `
              <div class="kanban-column">
                <div class="column-header" style="border-color: ${board.color}">
                  <span class="column-icon">${board.icon}</span>
                  <span class="column-title">${board.name}</span>
                  <span class="column-count">${boardTasks.filter(t => t.completedToday).length}/${boardTasks.length}</span>
                </div>
                <div class="column-content">
                  ${boardTasks.map(task => `
                    <div class="task-card ${task.completedToday ? 'completed' : ''}" data-task-id="${task.id}">
                      <div class="task-checkbox" onclick="Today.toggleTask('${task.id}')">
                        ${task.completedToday ? '✓' : ''}
                      </div>
                      <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-desc">${task.description}</div>` : ''}
                      </div>
                      <button class="task-delete" onclick="Today.deleteTask('${task.id}')">🗑</button>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (this.currentView === 'list') {
      container.innerHTML = `
        <div class="list-view">
          ${tasks.map(task => {
            const board = APP_CONFIG.boards.find(b => b.id === task.boardId);
            return `
              <div class="task-item ${task.completedToday ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox" onclick="Today.toggleTask('${task.id}')">
                  ${task.completedToday ? '✓' : ''}
                </div>
                <div class="task-content">
                  <div class="task-title">${task.title}</div>
                  ${task.description ? `<div class="task-desc">${task.description}</div>` : ''}
                </div>
                <div class="task-board-tag" style="background: ${board.color}">${board.icon}</div>
                <button class="task-delete" onclick="Today.deleteTask('${task.id}')">🗑</button>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      // 时间轴视图
      const hours = Array.from({ length: 24 }, (_, i) => i);
      container.innerHTML = `
        <div class="timeline-view">
          ${hours.map(hour => {
            const hourTasks = tasks.filter(t => {
              if (!t.completedAt) return false;
              const taskHour = new Date(t.completedAt).getHours();
              return taskHour === hour;
            });
            return `
              <div class="timeline-hour">
                <div class="hour-label">${hour.toString().padStart(2, '0')}:00</div>
                <div class="hour-content">
                  ${hourTasks.map(task => {
                    const board = APP_CONFIG.boards.find(b => b.id === task.boardId);
                    return `
                      <div class="timeline-task">
                        <span class="task-board-icon">${board.icon}</span>
                        <span class="task-title">${task.title}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  },

  bindEvents() {
    // 视图切换
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.onclick = () => {
        this.currentView = btn.dataset.view;
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderTasks();
      };
    });

    // 快速添加
    document.getElementById('quick-add-btn').onclick = () => {
      const input = document.getElementById('quick-add-input');
      const boardSelect = document.getElementById('quick-add-board');
      const title = input.value.trim();

      if (title) {
        DataManager.addTask(boardSelect.value, title);
        input.value = '';
        this.renderTasks();
        UI.toast.show('任务添加成功！', 'success');
      }
    };

    // 回车添加
    document.getElementById('quick-add-input').onkeypress = (e) => {
      if (e.key === 'Enter') {
        document.getElementById('quick-add-btn').click();
      }
    };
  },

  toggleTask(taskId) {
    const task = DataManager.toggleTask(taskId);
    if (task) {
      this.renderTasks();

      // 检查成就
      const newAchievements = DataManager.checkAchievements();
      if (newAchievements.length > 0) {
        newAchievements.forEach(a => {
          UI.toast.show(`🎉 解锁成就：${a.name}`, 'success');
        });
      } else if (task.completed) {
        UI.toast.show('任务已完成！', 'success');
      }

      // 触发完成动画
      const card = document.querySelector(`[data-task-id="${taskId}"]`);
      if (card) {
        card.classList.add('task-complete-animation');
        setTimeout(() => card.classList.remove('task-complete-animation'), 500);
      }
    }
  },

  deleteTask(taskId) {
    UI.confirm('确定要删除这个任务吗？').then(confirmed => {
      if (confirmed) {
        DataManager.deleteTask(taskId);
        this.renderTasks();
        UI.toast.show('任务已删除', 'info');
      }
    });
  }
};

// ==================== 页面：板块详情 ====================
const BoardDetail = {
  render(boardId) {
    const board = APP_CONFIG.boards.find(b => b.id === boardId);
    if (!board) {
      Router.navigate('dashboard');
      return;
    }

    const tasks = (DataManager.get('tasks') || []).filter(t => t.boardId === boardId);
    const completed = tasks.filter(t => t.completed).length;
    const rate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    document.getElementById('main-content').innerHTML = `
      <div class="board-detail-page">
        <div class="board-header-section" style="background: linear-gradient(135deg, ${board.color}, ${board.color}88)">
          <button class="back-btn" onclick="Router.back()">← 返回</button>
          <div class="board-icon-large">${board.icon}</div>
          <h1>${board.name}</h1>
          <div class="board-stats">
            <div class="stat">
              <span class="value">${completed}</span>
              <span class="label">已完成</span>
            </div>
            <div class="stat">
              <span class="value">${tasks.length}</span>
              <span class="label">总任务</span>
            </div>
            <div class="stat">
              <span class="value">${rate}%</span>
              <span class="label">完成率</span>
            </div>
          </div>
        </div>

        <div class="board-tasks-section">
          <h2>任务列表</h2>
          <div class="task-list">
            ${tasks.map(task => `
              <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-checkbox" onclick="BoardDetail.toggleTask('${task.id}')">
                  ${task.completed ? '✓' : ''}
                </div>
                <div class="task-content">
                  <div class="task-title">${task.title}</div>
                  ${task.description ? `<div class="task-desc">${task.description}</div>` : ''}
                  ${task.completedAt ? `<div class="task-time">完成于: ${new Date(task.completedAt).toLocaleString()}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  toggleTask(taskId) {
    DataManager.toggleTask(taskId);
    const boardId = taskId.split('_')[1];
    const tasks = DataManager.get('tasks') || [];
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      this.render(task.boardId);
    }
  }
};

// ==================== 页面：文档库 ====================
const Library = {
  currentFilter: { board: 'all', type: 'all' },
  searchTerm: '',

  render() {
    document.getElementById('main-content').innerHTML = `
      <div class="library-page">
        <div class="library-header">
          <h1>文档库</h1>
          <button class="btn btn-primary" onclick="Library.showAddModal()">+ 新建文档</button>
        </div>

        <div class="library-filters">
          <select id="filter-board" onchange="Library.updateFilter()">
            <option value="all">所有板块</option>
            ${APP_CONFIG.boards.map(b => `<option value="${b.id}">${b.icon} ${b.name}</option>`).join('')}
          </select>
          <select id="filter-type" onchange="Library.updateFilter()">
            <option value="all">所有类型</option>
            <option value="note">笔记</option>
            <option value="summary">总结</option>
            <option value="insight">见解</option>
          </select>
          <input type="text" id="search-input" placeholder="搜索文档..." oninput="Library.search(this.value)">
        </div>

        <div id="documents-list"></div>
      </div>
    `;

    this.renderDocuments();
  },

  renderDocuments() {
    let documents = DataManager.get('documents') || [];

    // 应用筛选
    if (this.currentFilter.board !== 'all') {
      documents = documents.filter(d => d.boardId === this.currentFilter.board);
    }
    if (this.currentFilter.type !== 'all') {
      documents = documents.filter(d => d.type === this.currentFilter.type);
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      documents = documents.filter(d =>
        d.title.toLowerCase().includes(term) ||
        d.content.toLowerCase().includes(term) ||
        (d.tags && d.tags.some(t => t.toLowerCase().includes(term)))
      );
    }

    const container = document.getElementById('documents-list');

    if (documents.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📄</div>
          <p>暂无文档</p>
          <button class="btn btn-primary" onclick="Library.showAddModal()">创建第一篇文档</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="document-grid">
        ${documents.map(doc => {
          const board = APP_CONFIG.boards.find(b => b.id === doc.boardId);
          return `
            <div class="document-card" onclick="Library.showDetail('${doc.id}')">
              <div class="doc-header">
                <span class="doc-board" style="background: ${board?.color || '#666'}">${board?.icon || '📄'}</span>
                <span class="doc-type">${doc.type || '笔记'}</span>
              </div>
              <h3 class="doc-title">${doc.title}</h3>
              <p class="doc-preview">${doc.content.substring(0, 100)}...</p>
              <div class="doc-footer">
                <span class="doc-date">${new Date(doc.createdAt).toLocaleDateString()}</span>
                <div class="doc-actions">
                  <button onclick="event.stopPropagation(); Library.editDocument('${doc.id}')">编辑</button>
                  <button onclick="event.stopPropagation(); Library.deleteDocument('${doc.id}')">删除</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  updateFilter() {
    this.currentFilter.board = document.getElementById('filter-board').value;
    this.currentFilter.type = document.getElementById('filter-type').value;
    this.renderDocuments();
  },

  search(term) {
    this.searchTerm = term;
    this.renderDocuments();
  },

  showAddModal() {
    UI.modal.show({
      title: '新建文档',
      content: `
        <div class="form-group">
          <label>标题</label>
          <input type="text" id="doc-title" class="input" placeholder="请输入标题">
        </div>
        <div class="form-group">
          <label>板块</label>
          <select id="doc-board" class="input">
            ${APP_CONFIG.boards.map(b => `<option value="${b.id}">${b.icon} ${b.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>类型</label>
          <select id="doc-type" class="input">
            <option value="note">笔记</option>
            <option value="summary">总结</option>
            <option value="insight">见解</option>
          </select>
        </div>
        <div class="form-group">
          <label>观点提取</label>
          <textarea id="doc-points" class="input" rows="3" placeholder="① 第一个观点&#10;② 第二个观点&#10;③ 第三个观点"></textarea>
        </div>
        <div class="form-group">
          <label>个人见解</label>
          <textarea id="doc-insight" class="input" rows="3" placeholder="你的个人见解..."></textarea>
        </div>
        <div class="form-group">
          <label>来源链接</label>
          <input type="url" id="doc-source" class="input" placeholder="https://...">
        </div>
        <div class="form-group">
          <label>标签（逗号分隔）</label>
          <input type="text" id="doc-tags" class="input" placeholder="标签1, 标签2">
        </div>
      `,
      confirmText: '创建',
      onConfirm: () => {
        const title = document.getElementById('doc-title').value.trim();
        if (!title) {
          UI.toast.show('请输入标题', 'error');
          return;
        }

        const doc = {
          title,
          boardId: document.getElementById('doc-board').value,
          type: document.getElementById('doc-type').value,
          content: document.getElementById('doc-points').value,
          insight: document.getElementById('doc-insight').value,
          source: document.getElementById('doc-source').value,
          tags: document.getElementById('doc-tags').value.split(',').map(t => t.trim()).filter(t => t)
        };

        DataManager.addDocument(doc);
        this.renderDocuments();
        UI.toast.show('文档创建成功！', 'success');

        // 检查成就
        const newAchievements = DataManager.checkAchievements();
        newAchievements.forEach(a => UI.toast.show(`🎉 解锁成就：${a.name}`, 'success'));
      }
    });
  },

  editDocument(docId) {
    const docs = DataManager.get('documents') || [];
    const doc = docs.find(d => d.id === docId);
    if (!doc) return;

    UI.modal.show({
      title: '编辑文档',
      content: `
        <div class="form-group">
          <label>标题</label>
          <input type="text" id="doc-title" class="input" value="${doc.title}">
        </div>
        <div class="form-group">
          <label>板块</label>
          <select id="doc-board" class="input">
            ${APP_CONFIG.boards.map(b => `<option value="${b.id}" ${b.id === doc.boardId ? 'selected' : ''}>${b.icon} ${b.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>类型</label>
          <select id="doc-type" class="input">
            <option value="note" ${doc.type === 'note' ? 'selected' : ''}>笔记</option>
            <option value="summary" ${doc.type === 'summary' ? 'selected' : ''}>总结</option>
            <option value="insight" ${doc.type === 'insight' ? 'selected' : ''}>见解</option>
          </select>
        </div>
        <div class="form-group">
          <label>观点提取</label>
          <textarea id="doc-points" class="input" rows="3">${doc.content}</textarea>
        </div>
        <div class="form-group">
          <label>个人见解</label>
          <textarea id="doc-insight" class="input" rows="3">${doc.insight || ''}</textarea>
        </div>
        <div class="form-group">
          <label>来源链接</label>
          <input type="url" id="doc-source" class="input" value="${doc.source || ''}">
        </div>
        <div class="form-group">
          <label>标签（逗号分隔）</label>
          <input type="text" id="doc-tags" class="input" value="${(doc.tags || []).join(', ')}">
        </div>
      `,
      confirmText: '保存',
      onConfirm: () => {
        DataManager.updateDocument(docId, {
          title: document.getElementById('doc-title').value,
          boardId: document.getElementById('doc-board').value,
          type: document.getElementById('doc-type').value,
          content: document.getElementById('doc-points').value,
          insight: document.getElementById('doc-insight').value,
          source: document.getElementById('doc-source').value,
          tags: document.getElementById('doc-tags').value.split(',').map(t => t.trim()).filter(t => t)
        });
        this.renderDocuments();
        UI.toast.show('文档更新成功！', 'success');
      }
    });
  },

  deleteDocument(docId) {
    UI.confirm('确定要删除这篇文档吗？').then(confirmed => {
      if (confirmed) {
        DataManager.deleteDocument(docId);
        this.renderDocuments();
        UI.toast.show('文档已删除', 'info');
      }
    });
  },

  showDetail(docId) {
    const docs = DataManager.get('documents') || [];
    const doc = docs.find(d => d.id === docId);
    if (!doc) return;

    const board = APP_CONFIG.boards.find(b => b.id === doc.boardId);

    UI.modal.show({
      title: doc.title,
      content: `
        <div class="doc-detail">
          <div class="doc-meta">
            <span style="background: ${board?.color || '#666'}">${board?.icon || '📄'} ${board?.name || '未分类'}</span>
            <span>${doc.type || '笔记'}</span>
            <span>${new Date(doc.createdAt).toLocaleString()}</span>
          </div>
          ${doc.content ? `
            <div class="doc-section">
              <h4>观点提取</h4>
              <div class="doc-content">${doc.content.replace(/\n/g, '<br>')}</div>
            </div>
          ` : ''}
          ${doc.insight ? `
            <div class="doc-section">
              <h4>个人见解</h4>
              <div class="doc-content">${doc.insight.replace(/\n/g, '<br>')}</div>
            </div>
          ` : ''}
          ${doc.source ? `
            <div class="doc-section">
              <h4>来源链接</h4>
              <a href="${doc.source}" target="_blank" class="doc-link">${doc.source}</a>
            </div>
          ` : ''}
          ${doc.tags && doc.tags.length > 0 ? `
            <div class="doc-section">
              <h4>标签</h4>
              <div class="doc-tags">${doc.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
            </div>
          ` : ''}
        </div>
      `,
      confirmText: '关闭'
    });
  }
};

// ==================== 页面：AI助手 ====================
const AIAssist = {
  render() {
    document.getElementById('main-content').innerHTML = `
      <div class="ai-page">
        <h1>AI 助手</h1>

        <div class="ai-tabs">
          <button class="ai-tab active" data-tab="search">内容搜索</button>
          <button class="ai-tab" data-tab="extract">观点提炼</button>
          <button class="ai-tab" data-tab="insight">见解生成</button>
        </div>

        <div id="ai-content">
          <div class="ai-panel active" id="panel-search">
            <div class="form-group">
              <label>搜索关键词</label>
              <input type="text" id="search-keyword" class="input" placeholder="输入关键词搜索文档库">
            </div>
            <button class="btn btn-primary" onclick="AIAssist.searchContent()">搜索</button>
            <div id="search-results" class="ai-results"></div>
          </div>

          <div class="ai-panel" id="panel-extract">
            <div class="form-group">
              <label>输入内容</label>
              <textarea id="extract-content" class="input" rows="6" placeholder="粘贴需要提炼观点的内容..."></textarea>
            </div>
            <button class="btn btn-primary" onclick="AIAssist.extractPoints()">提炼观点</button>
            <div id="extract-results" class="ai-results"></div>
          </div>

          <div class="ai-panel" id="panel-insight">
            <div class="form-group">
              <label>输入观点</label>
              <textarea id="insight-points" class="input" rows="4" placeholder="输入观点，每行一个..."></textarea>
            </div>
            <button class="btn btn-primary" onclick="AIAssist.generateInsight()">生成见解</button>
            <div id="insight-results" class="ai-results"></div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    document.querySelectorAll('.ai-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.ai-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.ai-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
      };
    });
  },

  searchContent() {
    const keyword = document.getElementById('search-keyword').value.trim();
    if (!keyword) {
      UI.toast.show('请输入搜索关键词', 'error');
      return;
    }

    const documents = DataManager.get('documents') || [];
    const results = documents.filter(d =>
      d.title.includes(keyword) ||
      d.content.includes(keyword) ||
      (d.insight && d.insight.includes(keyword)) ||
      (d.tags && d.tags.some(t => t.includes(keyword)))
    );

    const container = document.getElementById('search-results');

    if (results.length === 0) {
      container.innerHTML = `<div class="empty-result">未找到相关内容</div>`;
      return;
    }

    container.innerHTML = `
      <div class="search-results-list">
        ${results.map(doc => {
          const board = APP_CONFIG.boards.find(b => b.id === doc.boardId);
          return `
            <div class="search-result-item" onclick="Library.showDetail('${doc.id}')">
              <div class="result-header">
                <span style="background: ${board?.color || '#666'}">${board?.icon || '📄'}</span>
                <h4>${doc.title}</h4>
              </div>
              <p>${doc.content.substring(0, 100)}...</p>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  extractPoints() {
    const content = document.getElementById('extract-content').value.trim();
    if (!content) {
      UI.toast.show('请输入内容', 'error');
      return;
    }

    // 模拟观点提炼（实际应用中可接入AI API）
    const sentences = content.split(/[。！？\n]/).filter(s => s.trim());
    const points = sentences.slice(0, 5).map((s, i) => `${'①②③④⑤'[i]} ${s.trim()}`);

    const container = document.getElementById('extract-results');
    container.innerHTML = `
      <div class="extract-result">
        <h4>提取的观点：</h4>
        <div class="points-list">
          ${points.map(p => `<div class="point-item">${p}</div>`).join('')}
        </div>
        <button class="btn btn-secondary" onclick="AIAssist.saveExtracted('${encodeURIComponent(points.join('\n'))}')">保存到文档库</button>
      </div>
    `;
  },

  saveExtracted(encodedPoints) {
    const points = decodeURIComponent(encodedPoints);
    UI.modal.show({
      title: '保存到文档库',
      content: `
        <div class="form-group">
          <label>标题</label>
          <input type="text" id="save-title" class="input" placeholder="文档标题">
        </div>
        <div class="form-group">
          <label>板块</label>
          <select id="save-board" class="input">
            ${APP_CONFIG.boards.map(b => `<option value="${b.id}">${b.icon} ${b.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>内容</label>
          <textarea id="save-content" class="input" rows="6">${points}</textarea>
        </div>
      `,
      confirmText: '保存',
      onConfirm: () => {
        const title = document.getElementById('save-title').value.trim();
        if (!title) {
          UI.toast.show('请输入标题', 'error');
          return;
        }

        DataManager.addDocument({
          title,
          boardId: document.getElementById('save-board').value,
          type: 'summary',
          content: document.getElementById('save-content').value
        });

        UI.toast.show('保存成功！', 'success');
      }
    });
  },

  generateInsight() {
    const points = document.getElementById('insight-points').value.trim();
    if (!points) {
      UI.toast.show('请输入观点', 'error');
      return;
    }

    // 模拟见解生成
    const pointList = points.split('\n').filter(p => p.trim());
    const insights = pointList.map(p => {
      const templates = [
        `对于"${p}"这一观点，我认为其核心价值在于实践应用，需要在日常生活中不断强化。`,
        `"${p}"这个观点启发我思考如何在个人成长中找到平衡点，既要有目标，也要有方法。`,
        `结合"${p}"的理解，我计划将其应用到本周的训练计划中，期待看到具体的效果。`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    });

    const container = document.getElementById('insight-results');
    container.innerHTML = `
      <div class="insight-result">
        <h4>生成的见解：</h4>
        <div class="insights-list">
          ${insights.map(i => `<div class="insight-item">${i}</div>`).join('')}
        </div>
        <button class="btn btn-secondary" onclick="AIAssist.saveInsight('${encodeURIComponent(insights.join('\n'))}')">保存到文档库</button>
      </div>
    `;
  },

  saveInsight(encodedInsights) {
    const insights = decodeURIComponent(encodedInsights);
    UI.modal.show({
      title: '保存到文档库',
      content: `
        <div class="form-group">
          <label>标题</label>
          <input type="text" id="insight-title" class="input" placeholder="文档标题">
        </div>
        <div class="form-group">
          <label>板块</label>
          <select id="insight-board" class="input">
            ${APP_CONFIG.boards.map(b => `<option value="${b.id}">${b.icon} ${b.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>见解内容</label>
          <textarea id="insight-content" class="input" rows="6">${insights}</textarea>
        </div>
      `,
      confirmText: '保存',
      onConfirm: () => {
        const title = document.getElementById('insight-title').value.trim();
        if (!title) {
          UI.toast.show('请输入标题', 'error');
          return;
        }

        DataManager.addDocument({
          title,
          boardId: document.getElementById('insight-board').value,
          type: 'insight',
          content: '',
          insight: document.getElementById('insight-content').value
        });

        UI.toast.show('保存成功！', 'success');
      }
    });
  }
};

// ==================== 页面：设置 ====================
const Settings = {
  render() {
    const settings = DataManager.get('settings');

    document.getElementById('main-content').innerHTML = `
      <div class="settings-page">
        <h1>设置</h1>

        <div class="settings-section">
          <h2>外观设置</h2>
          <div class="setting-item">
            <label>主题模式</label>
            <div class="theme-toggle">
              <button class="theme-btn ${settings.theme === 'light' ? 'active' : ''}" data-theme="light">☀️ 浅色</button>
              <button class="theme-btn ${settings.theme === 'dark' ? 'active' : ''}" data-theme="dark">🌙 深色</button>
              <button class="theme-btn ${settings.theme === 'auto' ? 'active' : ''}" data-theme="auto">🔄 自动</button>
            </div>
          </div>

          <div class="setting-item">
            <label>配色方案</label>
            <div class="color-schemes">
              ${APP_CONFIG.colorSchemes.map(scheme => `
                <button class="color-btn ${settings.colorScheme === scheme.id ? 'active' : ''}"
                        style="background: ${scheme.primary}"
                        data-scheme="${scheme.id}"
                        title="${scheme.name}">
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2>提醒设置</h2>
          <div class="setting-item">
            <label>每日提醒时间</label>
            <input type="time" id="reminder-time" class="input" value="${settings.reminderTime}">
          </div>
        </div>

        <div class="settings-section">
          <h2>飞书集成</h2>
          <div class="setting-item">
            <label>Webhook 地址</label>
            <input type="url" id="feishu-webhook" class="input" value="${settings.feishuWebhook}" placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/...">
          </div>
          <div class="setting-actions">
            <button class="btn btn-secondary" onclick="Settings.testFeishu()">测试连接</button>
            <button class="btn btn-primary" onclick="Settings.syncToFeishu()">同步文档</button>
          </div>
        </div>

        <div class="settings-section">
          <h2>任务管理</h2>
          <div class="setting-actions">
            <button class="btn btn-secondary" onclick="Settings.editTasks()">编辑任务</button>
            <button class="btn btn-primary" onclick="Settings.addTask()">添加任务</button>
          </div>
        </div>

        <div class="settings-section">
          <h2>数据管理</h2>
          <div class="setting-actions">
            <button class="btn btn-secondary" onclick="Settings.exportData()">导出数据</button>
            <button class="btn btn-secondary" onclick="Settings.importData()">导入数据</button>
            <button class="btn btn-danger" onclick="Settings.clearData()">清空数据</button>
          </div>
        </div>

        <div class="settings-section">
          <h2>关于</h2>
          <div class="about-info">
            <p>版本：${APP_CONFIG.version}</p>
            <p>自我管理系统 - 帮助你养成好习惯</p>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    // 主题切换
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.onclick = () => {
        const theme = btn.dataset.theme;
        const settings = DataManager.get('settings');
        settings.theme = theme;
        DataManager.set('settings', settings);

        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (theme === 'auto') {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        } else {
          document.documentElement.setAttribute('data-theme', theme);
        }
      };
    });

    // 配色方案
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.onclick = () => {
        const scheme = btn.dataset.scheme;
        ThemeManager.setColorScheme(scheme);

        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const settings = DataManager.get('settings');
        settings.colorScheme = scheme;
        DataManager.set('settings', settings);
      };
    });

    // 提醒时间
    document.getElementById('reminder-time').onchange = (e) => {
      const settings = DataManager.get('settings');
      settings.reminderTime = e.target.value;
      DataManager.set('settings', settings);
      UI.toast.show('提醒时间已更新', 'success');
    };

    // Webhook
    document.getElementById('feishu-webhook').onchange = (e) => {
      const settings = DataManager.get('settings');
      settings.feishuWebhook = e.target.value;
      DataManager.set('settings', settings);
    };
  },

  testFeishu() {
    const settings = DataManager.get('settings');
    if (!settings.feishuWebhook) {
      UI.toast.show('请先配置飞书 Webhook', 'error');
      return;
    }

    UI.toast.show('正在测试连接...', 'info');

    fetch(settings.feishuWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msg_type: 'text',
        content: { text: '🔔 测试连接成功！自我管理系统已连接。' }
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.code === 0 || data.StatusCode === 0) {
        UI.toast.show('飞书连接测试成功！', 'success');
      } else {
        UI.toast.show('连接失败: ' + (data.msg || '未知错误'), 'error');
      }
    })
    .catch(error => {
      UI.toast.show('连接失败: ' + error.message, 'error');
    });
  },

  async syncToFeishu() {
    const settings = DataManager.get('settings');
    if (!settings.feishuWebhook) {
      UI.toast.show('请先配置飞书 Webhook', 'error');
      return;
    }

    const documents = DataManager.get('documents') || [];
    if (documents.length === 0) {
      UI.toast.show('暂无文档可同步', 'error');
      return;
    }

    // 发送卡片消息
    const card = {
      msg_type: 'interactive',
      card: {
        header: {
          title: { tag: 'plain_text', content: '📚 文档库同步' },
          template: 'blue'
        },
        elements: [
          {
            tag: 'div',
            text: { tag: 'lark_md', content: `**同步文档数量:** ${documents.length}\n**同步时间:** ${new Date().toLocaleString()}` }
          },
          {
            tag: 'div',
            fields: documents.slice(0, 5).map(doc => ({
              is_short: true,
              text: { tag: 'lark_md', content: `**${doc.title}**\n${doc.content.substring(0, 50)}...` }
            }))
          }
        ]
      }
    };

    try {
      const response = await fetch(settings.feishuWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card)
      });
      const data = await response.json();

      if (data.code === 0 || data.StatusCode === 0) {
        UI.toast.show('同步成功！', 'success');
      } else {
        UI.toast.show('同步失败: ' + (data.msg || '未知错误'), 'error');
      }
    } catch (error) {
      UI.toast.show('同步失败: ' + error.message, 'error');
    }
  },

  editTasks() {
    const tasks = DataManager.get('tasks') || [];

    UI.modal.show({
      title: '编辑任务',
      content: `
        <div class="task-editor">
          ${APP_CONFIG.boards.map(board => `
            <div class="board-tasks">
              <h3>${board.icon} ${board.name}</h3>
              ${tasks.filter(t => t.boardId === board.id).map(task => `
                <div class="task-edit-item">
                  <input type="text" class="input task-title-input" value="${task.title}" data-task-id="${task.id}">
                  <button class="btn-icon" onclick="Settings.deleteTask('${task.id}')">🗑</button>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      `,
      confirmText: '保存',
      onConfirm: () => {
        document.querySelectorAll('.task-title-input').forEach(input => {
          const taskId = input.dataset.taskId;
          const tasks = DataManager.get('tasks') || [];
          const task = tasks.find(t => t.id === taskId);
          if (task) {
            task.title = input.value.trim();
          }
        });
        DataManager.set('tasks', tasks);
        UI.toast.show('任务已更新', 'success');
      }
    });
  },

  addTask() {
    UI.modal.show({
      title: '添加任务',
      content: `
        <div class="form-group">
          <label>任务标题</label>
          <input type="text" id="new-task-title" class="input" placeholder="输入任务标题">
        </div>
        <div class="form-group">
          <label>所属板块</label>
          <select id="new-task-board" class="input">
            ${APP_CONFIG.boards.map(b => `<option value="${b.id}">${b.icon} ${b.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>任务描述（可选）</label>
          <textarea id="new-task-desc" class="input" rows="3" placeholder="任务描述"></textarea>
        </div>
      `,
      confirmText: '添加',
      onConfirm: () => {
        const title = document.getElementById('new-task-title').value.trim();
        if (!title) {
          UI.toast.show('请输入任务标题', 'error');
          return;
        }

        DataManager.addTask(
          document.getElementById('new-task-board').value,
          title,
          document.getElementById('new-task-desc').value
        );

        UI.toast.show('任务添加成功', 'success');
      }
    });
  },

  deleteTask(taskId) {
    DataManager.deleteTask(taskId);
    this.editTasks(); // 刷新列表
    UI.toast.show('任务已删除', 'info');
  },

  exportData() {
    const data = {
      tasks: DataManager.get('tasks'),
      documents: DataManager.get('documents'),
      settings: DataManager.get('settings'),
      achievements: DataManager.get('achievements'),
      dailyRecords: DataManager.get('dailyRecords'),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `self-manage-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    UI.toast.show('数据已导出', 'success');
  },

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (data.tasks) DataManager.set('tasks', data.tasks);
        if (data.documents) DataManager.set('documents', data.documents);
        if (data.settings) DataManager.set('settings', data.settings);
        if (data.achievements) DataManager.set('achievements', data.achievements);
        if (data.dailyRecords) DataManager.set('dailyRecords', data.dailyRecords);

        UI.toast.show('数据导入成功！', 'success');
        ThemeManager.apply();
        Router.navigate('dashboard');
      } catch (error) {
        UI.toast.show('导入失败: ' + error.message, 'error');
      }
    };

    input.click();
  },

  async clearData() {
    const confirmed = await UI.confirm('确定要清空所有数据吗？此操作不可恢复！');
    if (confirmed) {
      Object.values(APP_CONFIG.storageKeys).forEach(key => {
        localStorage.removeItem(key);
      });
      DataManager.initDefaultData();
      UI.toast.show('数据已清空', 'info');
      Router.navigate('dashboard');
    }
  }
};

// ==================== 初始化应用 ====================
const App = {
  init() {
    // 初始化数据
    DataManager.initDefaultData();

    // 应用主题
    ThemeManager.apply();

    // 渲染应用框架
    this.renderApp();

    // 初始化路由
    Router.init();

    // 绑定全局事件
    this.bindGlobalEvents();

    // 检查每日提醒
    this.checkDailyReminder();
  },

  renderApp() {
    document.body.innerHTML = `
      <div id="app">
        <!-- 侧边栏（桌面端） -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <h1 class="logo">🎯 自我管理</h1>
          </div>
          <nav class="sidebar-nav">
            <a href="#dashboard" class="nav-item active" data-page="dashboard">
              <span class="nav-icon">📊</span>
              <span class="nav-text">数据看板</span>
            </a>
            <a href="#today" class="nav-item" data-page="today">
              <span class="nav-icon">✅</span>
              <span class="nav-text">今日任务</span>
            </a>
            ${APP_CONFIG.boards.map(board => `
              <a href="#board-${board.id}" class="nav-item board-nav" data-page="board-${board.id}">
                <span class="nav-icon">${board.icon}</span>
                <span class="nav-text">${board.name}</span>
              </a>
            `).join('')}
            <div class="nav-divider"></div>
            <a href="#library" class="nav-item" data-page="library">
              <span class="nav-icon">📚</span>
              <span class="nav-text">文档库</span>
            </a>
            <a href="#ai-assist" class="nav-item" data-page="ai-assist">
              <span class="nav-icon">🤖</span>
              <span class="nav-text">AI助手</span>
            </a>
            <a href="#settings" class="nav-item" data-page="settings">
              <span class="nav-icon">⚙️</span>
              <span class="nav-text">设置</span>
            </a>
          </nav>
        </aside>

        <!-- 主内容区 -->
        <main id="main-content" class="main-content"></main>

        <!-- 底部导航（移动端） -->
        <nav class="bottom-nav">
          <a href="#dashboard" class="bottom-nav-item active" data-page="dashboard">
            <span class="bottom-icon">📊</span>
            <span class="bottom-text">看板</span>
          </a>
          <a href="#today" class="bottom-nav-item" data-page="today">
            <span class="bottom-icon">✅</span>
            <span class="bottom-text">今日</span>
          </a>
          <a href="#library" class="bottom-nav-item" data-page="library">
            <span class="bottom-icon">📚</span>
            <span class="bottom-text">文档</span>
          </a>
          <a href="#ai-assist" class="bottom-nav-item" data-page="ai-assist">
            <span class="bottom-icon">🤖</span>
            <span class="bottom-text">AI</span>
          </a>
          <a href="#settings" class="bottom-nav-item" data-page="settings">
            <span class="bottom-icon">⚙️</span>
            <span class="bottom-text">设置</span>
          </a>
        </nav>

        <!-- Toast 容器 -->
        <div id="toast-container"></div>
      </div>

      <!-- 样式 -->
      <style>
        ${this.getStyles()}
      </style>
    `;
  },

  getStyles() {
    return `
      /* 基础变量 */
      :root {
        --primary-color: #4A90E2;
        --bg-color: #f5f7fa;
        --card-bg: #ffffff;
        --text-color: #333333;
        --text-secondary: #666666;
        --border-color: #e0e0e0;
        --shadow: 0 2px 8px rgba(0,0,0,0.1);
        --sidebar-width: 240px;
      }

      [data-theme="dark"] {
        --bg-color: #1a1a1a;
        --card-bg: #2d2d2d;
        --text-color: #ffffff;
        --text-secondary: #aaaaaa;
        --border-color: #444444;
        --shadow: 0 2px 8px rgba(0,0,0,0.3);
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: var(--bg-color);
        color: var(--text-color);
        line-height: 1.6;
      }

      /* 应用容器 */
      #app {
        display: flex;
        min-height: 100vh;
      }

      /* 侧边栏 */
      .sidebar {
        width: var(--sidebar-width);
        background: var(--card-bg);
        border-right: 1px solid var(--border-color);
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        overflow-y: auto;
        z-index: 100;
      }

      .sidebar-header {
        padding: 20px;
        border-bottom: 1px solid var(--border-color);
      }

      .logo {
        font-size: 20px;
        font-weight: 600;
      }

      .sidebar-nav {
        padding: 10px 0;
      }

      .nav-item {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        color: var(--text-color);
        text-decoration: none;
        transition: all 0.3s;
      }

      .nav-item:hover, .nav-item.active {
        background: var(--primary-color);
        color: white;
      }

      .nav-icon {
        margin-right: 12px;
        font-size: 20px;
      }

      .nav-divider {
        height: 1px;
        background: var(--border-color);
        margin: 10px 20px;
      }

      /* 主内容区 */
      .main-content {
        flex: 1;
        margin-left: var(--sidebar-width);
        padding: 30px;
        transition: opacity 0.3s;
      }

      .page-transition {
        opacity: 0;
      }

      /* 底部导航 */
      .bottom-nav {
        display: none;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--card-bg);
        border-top: 1px solid var(--border-color);
        z-index: 100;
      }

      .bottom-nav-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 10px;
        color: var(--text-secondary);
        text-decoration: none;
        transition: all 0.3s;
      }

      .bottom-nav-item.active {
        color: var(--primary-color);
      }

      .bottom-icon {
        font-size: 24px;
      }

      .bottom-text {
        font-size: 12px;
        margin-top: 4px;
      }

      /* 卡片 */
      .card {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 20px;
        box-shadow: var(--shadow);
        margin-bottom: 20px;
      }

      /* 按钮样式 */
      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s;
      }

      .btn-primary {
        background: var(--primary-color);
        color: white;
      }

      .btn-primary:hover {
        opacity: 0.9;
        transform: translateY(-2px);
      }

      .btn-secondary {
        background: var(--border-color);
        color: var(--text-color);
      }

      .btn-danger {
        background: #ff4757;
        color: white;
      }

      /* 输入框 */
      .input {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-size: 14px;
        background: var(--card-bg);
        color: var(--text-color);
        transition: border-color 0.3s;
      }

      .input:focus {
        outline: none;
        border-color: var(--primary-color);
      }

      textarea.input {
        resize: vertical;
        font-family: inherit;
      }

      /* Toast */
      #toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
      }

      .toast {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        background: var(--card-bg);
        border-radius: 8px;
        box-shadow: var(--shadow);
        margin-bottom: 10px;
        transform: translateX(100%);
        transition: transform 0.3s;
      }

      .toast.show {
        transform: translateX(0);
      }

      .toast-success { border-left: 4px solid #27ae60; }
      .toast-error { border-left: 4px solid #e74c3c; }
      .toast-info { border-left: 4px solid var(--primary-color); }

      /* Modal */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s;
      }

      .modal-overlay.show {
        opacity: 1;
      }

      .modal {
        background: var(--card-bg);
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid var(--border-color);
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--text-secondary);
      }

      .modal-body {
        padding: 20px;
      }

      .modal-footer {
        padding: 20px;
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      /* 数据看板页面 */
      .dashboard-page h1 {
        font-size: 28px;
        margin-bottom: 8px;
      }

      .subtitle {
        color: var(--text-secondary);
        margin-bottom: 30px;
      }

      .progress-ring-section {
        display: flex;
        justify-content: center;
        margin: 30px 0;
      }

      .progress-ring {
        position: relative;
        width: 150px;
        height: 150px;
      }

      .progress-ring svg {
        transform: rotate(0deg);
      }

      .progress-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }

      .progress-text .rate {
        font-size: 32px;
        font-weight: bold;
        color: var(--primary-color);
      }

      .progress-text .label {
        display: block;
        font-size: 12px;
        color: var(--text-secondary);
      }

      .stats-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }

      .stat-card {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        align-items: center;
        box-shadow: var(--shadow);
      }

      .stat-icon {
        font-size: 32px;
        margin-right: 16px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: bold;
      }

      .stat-label {
        font-size: 12px;
        color: var(--text-secondary);
      }

      /* 柱状图 */
      .chart-section {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: var(--shadow);
      }

      .chart-section h2 {
        margin-bottom: 20px;
        font-size: 18px;
      }

      .bar-chart {
        display: flex;
        justify-content: space-around;
        align-items: flex-end;
        height: 150px;
        padding: 20px 0;
      }

      .bar-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
      }

      .bar-container {
        width: 30px;
        height: 100px;
        background: var(--border-color);
        border-radius: 4px;
        display: flex;
        align-items: flex-end;
        margin-bottom: 8px;
      }

      .bar {
        width: 100%;
        background: var(--primary-color);
        border-radius: 4px;
        transition: height 0.5s;
      }

      .bar-label {
        font-size: 12px;
        color: var(--text-secondary);
      }

      /* 板块进度 */
      .board-progress-section {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: var(--shadow);
      }

      .board-progress-section h2 {
        margin-bottom: 20px;
        font-size: 18px;
      }

      .board-progress-item {
        padding: 15px 0;
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        transition: background 0.3s;
      }

      .board-progress-item:hover {
        background: var(--bg-color);
      }

      .board-header {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }

      .board-icon {
        font-size: 20px;
        margin-right: 10px;
      }

      .board-name {
        flex: 1;
        font-weight: 500;
      }

      .board-rate {
        color: var(--text-secondary);
      }

      .progress-bar {
        height: 8px;
        background: var(--border-color);
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.5s;
      }

      /* 成就墙 */
      .achievement-section {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 20px;
        box-shadow: var(--shadow);
      }

      .achievement-section h2 {
        margin-bottom: 20px;
        font-size: 18px;
      }

      .achievement-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 15px;
      }

      .achievement-item {
        text-align: center;
        padding: 15px;
        border-radius: 8px;
        background: var(--bg-color);
        transition: all 0.3s;
      }

      .achievement-item.unlocked {
        background: linear-gradient(135deg, #fff9c4, #fff59d);
      }

      .achievement-item.locked {
        opacity: 0.5;
      }

      .achievement-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }

      .achievement-name {
        font-weight: bold;
        margin-bottom: 4px;
      }

      .achievement-desc {
        font-size: 12px;
        color: var(--text-secondary);
      }

      /* 今日任务页面 */
      .today-page {
        max-width: 1400px;
        margin: 0 auto;
      }

      .view-toggle {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
      }

      .view-btn {
        padding: 8px 20px;
        border: 1px solid var(--border-color);
        background: var(--card-bg);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
      }

      .view-btn.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .quick-add {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .quick-add input {
        flex: 1;
        min-width: 200px;
      }

      /* 看板视图 */
      .kanban-view {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
      }

      .kanban-column {
        background: var(--card-bg);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: var(--shadow);
      }

      .column-header {
        padding: 15px;
        border-left: 4px solid;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
      }

      .column-icon {
        font-size: 20px;
        margin-right: 10px;
      }

      .column-title {
        flex: 1;
        font-weight: 600;
      }

      .column-content {
        padding: 10px;
        min-height: 200px;
      }

      .task-card {
        background: var(--bg-color);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 10px;
        display: flex;
        align-items: flex-start;
        transition: all 0.3s;
      }

      .task-card.completed {
        opacity: 0.6;
      }

      .task-card.completed .task-title {
        text-decoration: line-through;
      }

      .task-checkbox {
        width: 24px;
        height: 24px;
        border: 2px solid var(--border-color);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.3s;
      }

      .task-card.completed .task-checkbox {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .task-content {
        flex: 1;
      }

      .task-title {
        font-weight: 500;
        margin-bottom: 4px;
      }

      .task-desc {
        font-size: 12px;
        color: var(--text-secondary);
      }

      .task-delete {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        opacity: 0.5;
        transition: opacity 0.3s;
      }

      .task-delete:hover {
        opacity: 1;
      }

      .task-complete-animation {
        animation: taskComplete 0.5s ease;
      }

      @keyframes taskComplete {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }

      /* 列表视图 */
      .list-view {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .task-item {
        background: var(--card-bg);
        border-radius: 8px;
        padding: 15px;
        display: flex;
        align-items: center;
        box-shadow: var(--shadow);
        transition: all 0.3s;
      }

      .task-board-tag {
        padding: 4px 8px;
        border-radius: 4px;
        color: white;
        font-size: 12px;
        margin-left: 10px;
      }

      /* 时间轴视图 */
      .timeline-view {
        display: flex;
        flex-direction: column;
      }

      .timeline-hour {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        min-height: 50px;
      }

      .hour-label {
        width: 60px;
        padding: 10px;
        color: var(--text-secondary);
        font-size: 12px;
        border-right: 1px solid var(--border-color);
      }

      .hour-content {
        flex: 1;
        padding: 5px 10px;
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }

      .timeline-task {
        background: var(--card-bg);
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 13px;
        box-shadow: var(--shadow);
      }

      .task-board-icon {
        margin-right: 5px;
      }

      /* 板块详情页 */
      .board-detail-page {
        max-width: 800px;
        margin: 0 auto;
      }

      .board-header-section {
        border-radius: 12px;
        padding: 30px;
        margin-bottom: 20px;
        color: white;
        position: relative;
      }

      .back-btn {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        margin-bottom: 20px;
      }

      .board-icon-large {
        font-size: 48px;
        margin-bottom: 10px;
      }

      .board-stats {
        display: flex;
        gap: 30px;
        margin-top: 20px;
      }

      .board-stats .stat {
        text-align: center;
      }

      .board-stats .value {
        font-size: 28px;
        font-weight: bold;
      }

      .board-stats .label {
        font-size: 12px;
        opacity: 0.9;
      }

      .board-tasks-section {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 20px;
        box-shadow: var(--shadow);
      }

      .task-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .task-time {
        font-size: 11px;
        color: var(--text-secondary);
        margin-top: 5px;
      }

      /* 文档库页面 */
      .library-page {
        max-width: 1200px;
        margin: 0 auto;
      }

      .library-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .library-filters {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .library-filters select,
      .library-filters input {
        min-width: 150px;
      }

      .document-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
      }

      .document-card {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: var(--shadow);
      }

      .document-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      }

      .doc-header {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }

      .doc-board {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
        font-size: 14px;
      }

      .doc-type {
        font-size: 12px;
        color: var(--text-secondary);
        background: var(--bg-color);
        padding: 2px 8px;
        border-radius: 4px;
      }

      .doc-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .doc-preview {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.5;
        margin-bottom: 10px;
      }

      .doc-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: var(--text-secondary);
      }

      .doc-actions {
        display: flex;
        gap: 10px;
      }

      .doc-actions button {
        background: none;
        border: none;
        color: var(--primary-color);
        cursor: pointer;
        font-size: 12px;
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: 20px;
      }

      /* AI助手页面 */
      .ai-page {
        max-width: 800px;
        margin: 0 auto;
      }

      .ai-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
      }

      .ai-tab {
        padding: 10px 20px;
        border: 1px solid var(--border-color);
        background: var(--card-bg);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
      }

      .ai-tab.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .ai-panel {
        display: none;
        background: var(--card-bg);
        border-radius: 12px;
        padding: 20px;
        box-shadow: var(--shadow);
      }

      .ai-panel.active {
        display: block;
      }

      .ai-results {
        margin-top: 20px;
      }

      .search-results-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .search-result-item {
        background: var(--bg-color);
        padding: 15px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
      }

      .search-result-item:hover {
        background: var(--border-color);
      }

      .result-header {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }

      .result-header span {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
        font-size: 14px;
      }

      .result-header h4 {
        flex: 1;
      }

      .extract-result, .insight-result {
        background: var(--bg-color);
        padding: 15px;
        border-radius: 8px;
      }

      .extract-result h4, .insight-result h4 {
        margin-bottom: 15px;
      }

      .points-list, .insights-list {
        margin-bottom: 15px;
      }

      .point-item, .insight-item {
        padding: 10px;
        background: var(--card-bg);
        border-radius: 4px;
        margin-bottom: 8px;
      }

      .empty-result {
        text-align: center;
        color: var(--text-secondary);
        padding: 20px;
      }

      /* 设置页面 */
      .settings-page {
        max-width: 600px;
        margin: 0 auto;
      }

      .settings-page h1 {
        margin-bottom: 30px;
      }

      .settings-section {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: var(--shadow);
      }

      .settings-section h2 {
        font-size: 16px;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border-color);
      }

      .setting-item {
        margin-bottom: 15px;
      }

      .setting-item label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
      }

      .theme-toggle {
        display: flex;
        gap: 10px;
      }

      .theme-btn {
        padding: 10px 20px;
        border: 1px solid var(--border-color);
        background: var(--bg-color);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
      }

      .theme-btn.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .color-schemes {
        display: flex;
        gap: 10px;
      }

      .color-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid transparent;
        cursor: pointer;
        transition: all 0.3s;
      }

      .color-btn.active {
        border-color: var(--text-color);
        transform: scale(1.1);
      }

      .setting-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .about-info {
        color: var(--text-secondary);
        font-size: 14px;
      }

      /* 表单组 */
      .form-group {
        margin-bottom: 15px;
      }

      .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
      }

      /* 文档详情 */
      .doc-detail {
        padding: 10px 0;
      }

      .doc-meta {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .doc-meta span {
        padding: 4px 12px;
        background: var(--bg-color);
        border-radius: 4px;
        font-size: 13px;
      }

      .doc-section {
        margin-bottom: 20px;
      }

      .doc-section h4 {
        margin-bottom: 10px;
        font-size: 14px;
        color: var(--text-secondary);
      }

      .doc-content {
        line-height: 1.8;
        white-space: pre-wrap;
      }

      .doc-link {
        color: var(--primary-color);
        word-break: break-all;
      }

      .doc-tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .tag {
        padding: 4px 12px;
        background: var(--bg-color);
        border-radius: 16px;
        font-size: 13px;
      }

      /* 任务编辑器 */
      .task-editor {
        max-height: 400px;
        overflow-y: auto;
      }

      .board-tasks {
        margin-bottom: 20px;
      }

      .board-tasks h3 {
        margin-bottom: 10px;
        font-size: 16px;
      }

      .task-edit-item {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
      }

      .task-title-input {
        flex: 1;
      }

      .btn-icon {
        padding: 8px 12px;
        border: none;
        background: var(--bg-color);
        border-radius: 4px;
        cursor: pointer;
      }

      /* 响应式设计 */
      @media (max-width: 768px) {
        .sidebar {
          display: none;
        }

        .main-content {
          margin-left: 0;
          padding: 20px 15px 80px;
        }

        .bottom-nav {
          display: flex;
        }

        .stats-cards {
          grid-template-columns: repeat(2, 1fr);
        }

        .kanban-view {
          grid-template-columns: 1fr;
        }

        .board-stats {
          justify-content: space-around;
        }

        .library-filters {
          flex-direction: column;
        }

        .quick-add {
          flex-direction: column;
        }

        .quick-add input {
          width: 100%;
        }
      }
    `;
  },

  bindGlobalEvents() {
    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const settings = DataManager.get('settings');
      if (settings.theme === 'auto') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });

    // 导航点击
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('.nav-item, .bottom-nav-item');
      if (navItem) {
        e.preventDefault();
        const page = navItem.dataset.page;
        Router.navigate(page);
      }
    });
  },

  checkDailyReminder() {
    const settings = DataManager.get('settings');
    if (!settings.reminderTime) return;

    const [hours, minutes] = settings.reminderTime.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    const timeDiff = reminderTime - now;

    if (timeDiff > 0 && timeDiff < 86400000) {
      setTimeout(() => {
        this.sendDailyReminder();
      }, timeDiff);
    }
  },

  async sendDailyReminder() {
    const settings = DataManager.get('settings');
    if (!settings.feishuWebhook) return;

    const tasks = DataManager.getTodayTasks();
    const completed = tasks.filter(t => t.completedToday).length;
    const total = tasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const card = {
      msg_type: 'interactive',
      card: {
        header: {
          title: { tag: 'plain_text', content: '📅 每日任务提醒' },
          template: 'blue'
        },
        elements: [
          {
            tag: 'div',
            text: { tag: 'lark_md', content: `**今日进度: ${rate}%**\n已完成 ${completed}/${total} 个任务` }
          },
          {
            tag: 'progress',
            percent: rate
          },
          {
            tag: 'note',
            elements: [
              { tag: 'plain_text', content: '继续加油，保持好习惯！' }
            ]
          }
        ]
      }
    };

    try {
      await fetch(settings.feishuWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card)
      });
    } catch (error) {
      console.error('发送提醒失败:', error);
    }
  }
};

// ==================== 启动应用 ====================
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});