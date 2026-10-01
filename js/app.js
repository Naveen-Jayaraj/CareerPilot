/**
 * Main Application Coordinator - Linear Style
 * SVG icons, responsive view switching, modal management, cloud sync
 */
import { storage } from './storage.js';
import { cloudSync } from './cloudSync.js';
import { notifications } from './notifications.js';
import { STAGES, KanbanView } from './kanbanView.js';
import { TableView } from './tableView.js';
import { CalendarView } from './calendarView.js';
import { StatsView } from './statsView.js';
import { PrepView } from './prepView.js';
import { authManager } from './authModal.js';
import { icons } from './icons.js';
import { getCompanyAvatar } from './avatars.js';

class App {
  constructor() {
    this.currentView = 'table'; // Default to clean spreadsheet table
    this.editingJob = null;
    this.views = {};
    this.init();
  }

  init() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }

    this.applyTheme(storage.getSettings().theme || 'cyber-dark');

    const mainContent = document.getElementById('view-container');
    this.views.kanban = new KanbanView(
      mainContent, 
      (job) => this.openEditModal(job),
      (job) => this.openDetailModal(job)
    );
    this.views.table = new TableView(
      mainContent, 
      (job) => this.openEditModal(job),
      (job) => this.openDetailModal(job)
    );
    this.views.calendar = new CalendarView(
      mainContent, 
      (job) => this.openEditModal(job),
      (job) => this.openDetailModal(job)
    );
    this.views.stats = new StatsView(mainContent);
    this.views.prep = new PrepView(
      mainContent, 
      (job) => this.openEditModal(job)
    );

    // Initial view: Table (Spreadsheet view) as default for clean, dense look
    this.switchView('table');

    this.setupNavigation();
    this.setupModals();
    this.setupHeaderActions();
    this.setupCloudSyncIndicator();

    window.addEventListener('jobs-updated', () => {
      this.refreshCurrentView();
    });

    window.addEventListener('cloud-sync-status', (e) => {
      this.updateCloudStatusUi(e.detail);
    });
  }

  switchView(viewName) {
    this.currentView = viewName;

    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === viewName);
    });

    // Update header view title
    const titleMap = {
      table: 'Spreadsheet Tracker',
      kanban: 'Pipeline Board',
      calendar: 'Calendar & Deadlines',
      prep: 'Prep & Revision Hub',
      stats: 'Analytics & Insights'
    };
    const titleEl = document.getElementById('header-view-name');
    if (titleEl) titleEl.textContent = titleMap[viewName] || 'Career Dashboard';

    this.refreshCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  refreshCurrentView() {
    if (this.views[this.currentView]) {
      this.views[this.currentView].render();
    }
  }

  setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const view = el.dataset.view;
        if (view) this.switchView(view);
      });
    });

    document.getElementById('mobile-fab-add')?.addEventListener('click', () => {
      this.openEditModal(null);
    });

    document.getElementById('header-add-btn')?.addEventListener('click', () => {
      this.openEditModal(null);
    });
  }

  setupHeaderActions() {
    const bellBtn = document.getElementById('btn-notifications-drawer');
    const drawer = document.getElementById('notification-drawer');
    const closeDrawerBtn = document.getElementById('btn-close-drawer');
    const backdrop = document.getElementById('drawer-backdrop');

    const toggleDrawer = (open) => {
      drawer.classList.toggle('open', open);
      backdrop.classList.toggle('open', open);
      if (open) this.renderNotificationDrawerContent();
    };

    bellBtn?.addEventListener('click', () => toggleDrawer(true));
    closeDrawerBtn?.addEventListener('click', () => toggleDrawer(false));
    backdrop?.addEventListener('click', () => toggleDrawer(false));

    document.getElementById('btn-header-lock-app')?.addEventListener('click', () => {
      authManager.lockApp();
    });

    // Theme toggle
    const themeBtn = document.getElementById('btn-theme-toggle');
    themeBtn?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'cyber-dark';
      const next = current === 'cyber-dark' ? 'light' : 'cyber-dark';
      this.applyTheme(next);
      const settings = storage.getSettings();
      settings.theme = next;
      storage.saveSettings(settings);
    });
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'cyber-dark' ? icons.sun : icons.moon;
      themeBtn.title = theme === 'cyber-dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
    }
  }

  setupCloudSyncIndicator() {
    const indicator = document.getElementById('cloud-status-indicator');
    const label = document.getElementById('cloud-status-label');
    const settings = storage.getSettings();

    if (settings.supabaseUrl) {
      indicator.className = 'status-indicator status-connecting';
      label.textContent = 'Cloud Connecting...';
    } else {
      indicator.className = 'status-indicator status-local';
      label.textContent = 'Local Vault';
    }
  }

  updateCloudStatusUi(detail) {
    const indicator = document.getElementById('cloud-status-indicator');
    const label = document.getElementById('cloud-status-label');
    if (!indicator || !label) return;

    if (detail.status === 'connected') {
      indicator.className = 'status-indicator status-connected';
      label.textContent = 'Cloud Synced';
    } else if (detail.status === 'syncing') {
      indicator.className = 'status-indicator status-syncing';
      label.textContent = 'Syncing...';
    } else if (detail.status === 'error') {
      indicator.className = 'status-indicator status-error';
      label.textContent = 'Sync Error';
    } else {
      indicator.className = 'status-indicator status-local';
      label.textContent = 'Local Vault';
    }
  }

  renderNotificationDrawerContent() {
    const list = document.getElementById('drawer-notification-list');
    const reminders = notifications.checkReminders();

    if (reminders.length === 0) {
      list.innerHTML = `
        <div class="empty-notifications">
          ${icons.bell}
          <div style="font-weight: 600; margin-top: 4px;">All caught up</div>
          <span style="font-size: 0.76rem;">No milestone deadlines or urgent interviews right now.</span>
        </div>
      `;
      return;
    }

    list.innerHTML = reminders.map(r => {
      let icon = icons.clock;
      if (r.type === 'milestone-today') icon = icons.alertCircle;
      if (r.type === 'nudge-followup') icon = icons.link;

      return `
        <div class="drawer-notification-item urgency-${r.urgency}" data-job-id="${r.jobId}">
          <div class="dn-icon">${icon}</div>
          <div class="dn-content">
            <div class="dn-title">${r.title}</div>
            <div class="dn-msg">${r.message}</div>
            <div class="dn-actions">
              <button class="btn btn-secondary btn-xs btn-open-job-from-notif" data-job-id="${r.jobId}">View</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.btn-open-job-from-notif').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('notification-drawer').classList.remove('open');
        document.getElementById('drawer-backdrop').classList.remove('open');
        const job = storage.getJob(btn.dataset.jobId);
        if (job) this.openDetailModal(job);
      });
    });

    const permBtn = document.getElementById('btn-enable-native-notifs');
    if (permBtn) {
      if ('Notification' in window && Notification.permission === 'granted') {
        permBtn.textContent = 'Alerts Active';
        permBtn.disabled = true;
      } else {
        permBtn.textContent = 'Enable Browser Alerts';
        permBtn.disabled = false;
        permBtn.onclick = async () => {
          await notifications.requestPermission();
          this.renderNotificationDrawerContent();
        };
      }
    }
  }

  // ==================== MODALS ====================

  setupModals() {
    const editModal = document.getElementById('job-edit-modal');
    const detailModal = document.getElementById('job-detail-modal');
    const cloudModal = document.getElementById('cloud-sync-modal');

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        editModal.classList.remove('active');
        detailModal.classList.remove('active');
        cloudModal.classList.remove('active');
      });
    });

    document.getElementById('job-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveJobForm();
    });

    document.getElementById('btn-add-form-checklist-item')?.addEventListener('click', () => {
      this.appendFormChecklistRow('', false);
    });

    document.getElementById('btn-modal-export-json')?.addEventListener('click', () => {
      storage.exportJSON();
      notifications.showToast('Downloaded JSON backup', 'success');
    });

    document.getElementById('btn-modal-export-csv')?.addEventListener('click', () => {
      storage.exportCSV();
      notifications.showToast('Downloaded CSV / Excel file', 'success');
    });

    const fileInput = document.getElementById('import-file-input');
    document.getElementById('btn-modal-import-file')?.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          const count = storage.importData(parsed);
          notifications.showToast(`Imported ${count} applications`, 'success');
          document.getElementById('notification-drawer')?.classList.remove('open');
          document.getElementById('drawer-backdrop')?.classList.remove('open');
          this.refreshCurrentView();
        } catch {
          notifications.showToast('Invalid JSON file format', 'warning');
        }
      };
      reader.readAsText(file);
    });

    // Real-time dynamic company logo & details preview
    ['form-company', 'form-role', 'form-status', 'form-package', 'form-workmode'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.updateFormPreview());
        el.addEventListener('change', () => this.updateFormPreview());
      }
    });
  }

  updateFormPreview() {
    const company = document.getElementById('form-company')?.value.trim() || 'Target Company';
    const role = document.getElementById('form-role')?.value.trim() || 'Software Engineer';
    const stage = document.getElementById('form-status')?.value || 'Applied';
    const pkg = document.getElementById('form-package')?.value.trim() || 'Competitive LPA';
    const mode = document.getElementById('form-workmode')?.value || 'On-site';

    const avatarContainer = document.getElementById('form-preview-avatar');
    if (avatarContainer) {
      avatarContainer.innerHTML = getCompanyAvatar(company === 'Target Company' ? '' : company, 42);
    }

    const compEl = document.getElementById('form-preview-company');
    if (compEl) compEl.textContent = company;

    const roleEl = document.getElementById('form-preview-role');
    if (roleEl) roleEl.textContent = role;

    const stageEl = document.getElementById('form-preview-stage');
    if (stageEl) {
      stageEl.textContent = stage;
      const stageObj = STAGES.find(s => s.id === stage);
      if (stageObj) {
        stageEl.style.borderColor = `${stageObj.color}66`;
        stageEl.style.background = `${stageObj.color}22`;
        stageEl.style.color = stageObj.color;
      }
    }

    const pkgEl = document.getElementById('form-preview-package');
    if (pkgEl) pkgEl.textContent = pkg;

    const modeEl = document.getElementById('form-preview-workmode');
    if (modeEl) modeEl.textContent = mode;
  }

  openEditModal(job = null) {
    this.editingJob = job;
    const modal = document.getElementById('job-edit-modal');
    const title = document.getElementById('edit-modal-title');
    title.textContent = job ? `Edit: ${job.company}` : 'Add Application';

    document.getElementById('form-job-id').value = job ? job.id : '';
    document.getElementById('form-company').value = job ? job.company : '';
    document.getElementById('form-role').value = job ? (job.role || '') : '';
    document.getElementById('form-status').value = job ? (job.status || 'Applied') : 'Applied';
    document.getElementById('form-package').value = job ? (job.packageLpa || '') : '';
    document.getElementById('form-workmode').value = job ? (job.workMode || 'On-site') : 'On-site';
    document.getElementById('form-applied-date').value = job ? (job.appliedDate || '') : new Date().toISOString().slice(0, 10);
    document.getElementById('form-milestone-date').value = job ? (job.nextMilestoneDate ? job.nextMilestoneDate.slice(0, 16) : '') : '';
    document.getElementById('form-milestone-type').value = job ? (job.milestoneType || 'Technical Interview') : 'Technical Interview';
    document.getElementById('form-channel').value = job ? (job.channel || '') : '';
    document.getElementById('form-contact').value = job ? (job.contactPerson || '') : '';
    document.getElementById('form-location').value = job ? (job.location || '') : '';
    document.getElementById('form-link').value = job ? (job.jobLink || '') : '';
    document.getElementById('form-notes').value = job ? (job.notes || '') : '';

    const checklistContainer = document.getElementById('form-checklist-container');
    checklistContainer.innerHTML = '';
    const checklist = job && job.prepChecklist ? job.prepChecklist : [];
    if (checklist.length === 0) {
      this.appendFormChecklistRow('Review DSA & system design', false);
      this.appendFormChecklistRow('Review company past questions', false);
    } else {
      checklist.forEach(item => this.appendFormChecklistRow(item.text, item.done));
    }

    this.updateFormPreview();
    modal.classList.add('active');
  }

  appendFormChecklistRow(text = '', done = false) {
    const container = document.getElementById('form-checklist-container');
    const row = document.createElement('div');
    row.className = 'form-checklist-row';
    row.innerHTML = `
      <input type="checkbox" class="form-chk-done" ${done ? 'checked' : ''} />
      <input type="text" class="form-chk-text form-input" placeholder="e.g. Study DSA, review resume" value="${text.replace(/"/g, '&quot;')}" />
      <button type="button" class="btn-remove-chk" title="Remove">&times;</button>
    `;
    row.querySelector('.btn-remove-chk').onclick = () => row.remove();
    container.appendChild(row);
  }

  handleSaveJobForm() {
    const id = document.getElementById('form-job-id').value;
    const company = document.getElementById('form-company').value.trim();
    if (!company) {
      notifications.showToast('Company name is required', 'warning');
      return;
    }

    const checklistItems = [];
    document.querySelectorAll('.form-checklist-row').forEach(row => {
      const text = row.querySelector('.form-chk-text').value.trim();
      const done = row.querySelector('.form-chk-done').checked;
      if (text) {
        checklistItems.push({
          id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          text,
          done
        });
      }
    });

    const jobData = {
      id: id || undefined,
      company,
      role: document.getElementById('form-role').value.trim(),
      status: document.getElementById('form-status').value,
      packageLpa: document.getElementById('form-package').value.trim(),
      workMode: document.getElementById('form-workmode').value,
      appliedDate: document.getElementById('form-applied-date').value,
      nextMilestoneDate: document.getElementById('form-milestone-date').value,
      milestoneType: document.getElementById('form-milestone-type').value,
      channel: document.getElementById('form-channel').value.trim(),
      contactPerson: document.getElementById('form-contact').value.trim(),
      location: document.getElementById('form-location').value.trim(),
      jobLink: document.getElementById('form-link').value.trim(),
      notes: document.getElementById('form-notes').value.trim(),
      prepChecklist: checklistItems
    };

    if (this.editingJob && this.editingJob.interviewRounds) {
      jobData.interviewRounds = this.editingJob.interviewRounds;
    }

    const saved = storage.saveJob(jobData);

    if (cloudSync.syncStatus === 'connected') {
      cloudSync.pushSingleJob(saved);
    }

    notifications.showToast(id ? `Updated ${company}` : `Added ${company}`, 'success');
    document.getElementById('job-edit-modal').classList.remove('active');
    this.refreshCurrentView();
  }

  openDetailModal(job) {
    const modal = document.getElementById('job-detail-modal');
    const content = document.getElementById('detail-modal-body');

    let daysActive = '-';
    if (job.appliedDate) {
      daysActive = `${Math.floor((new Date() - new Date(job.appliedDate)) / (1000 * 60 * 60 * 24))}d active`;
    }

    const gCalUrl = notifications.getGoogleCalendarUrl(job);
    const stageObj = STAGES.find(s => s.id === job.status) || STAGES[1];

    content.innerHTML = `
      <div class="detail-header-card">
        <div class="dh-top">
          <div>
            <div class="dh-company">${this.escape(job.company)}</div>
            <div class="dh-role">${this.escape(job.role || 'Unspecified Role')}</div>
          </div>
          <span class="dh-status-badge" style="background: ${stageObj.color}22; color: ${stageObj.color}; border: 1px solid ${stageObj.color}44;">
            ${stageObj.label}
          </span>
        </div>
        <div class="dh-meta-row">
          <span>Package: <strong>${this.escape(job.packageLpa || 'Not Disclosed')}</strong></span>
          <span>Location: <strong>${this.escape(job.location || job.workMode || 'On-site')}</strong></span>
          <span>Applied: <strong>${job.appliedDate || '-'}</strong> (${daysActive})</span>
          <span>Channel: <strong>${this.escape(job.channel || 'Direct')}</strong></span>
        </div>
      </div>

      ${job.nextMilestoneDate ? `
        <div class="detail-milestone-box">
          <div>
            <div class="dmb-title">${icons.clock} Next Milestone: ${this.escape(job.milestoneType || 'Milestone')}</div>
            <div class="dmb-time">${new Date(job.nextMilestoneDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
          </div>
          <div style="display: flex; gap: 6px;">
            ${gCalUrl ? `
              <a href="${gCalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs">
                + Google Cal
              </a>
            ` : ''}
            <button class="btn btn-secondary btn-xs" id="btn-detail-ics">
              ${icons.download} .ics
            </button>
          </div>
        </div>
      ` : ''}

      <div class="detail-quick-actions">
        ${this.safeUrl(job.jobLink) ? `
          <a href="${this.safeUrl(job.jobLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-xs">
            ${icons.link} Job Portal
          </a>
        ` : ''}
        <button class="btn btn-secondary btn-xs" id="btn-detail-edit">${icons.pencil} Edit</button>
        <button class="btn btn-secondary btn-xs" id="btn-detail-delete" style="color: var(--accent-rose);">${icons.trash} Delete</button>
      </div>

      <div class="detail-section">
        <h3>Preparation Tasks</h3>
        ${(!job.prepChecklist || job.prepChecklist.length === 0) ? `
          <div class="text-muted" style="font-size: 0.78rem;">No preparation tasks. Click Edit to add tasks.</div>
        ` : `
          <div class="detail-checklist">
            ${job.prepChecklist.map(item => `
              <label class="prep-check-row">
                <input type="checkbox" class="detail-chk-box" data-job-id="${job.id}" data-item-id="${item.id}" ${item.done ? 'checked' : ''} />
                <span class="${item.done ? 'item-done' : ''}">${this.escape(item.text)}</span>
              </label>
            `).join('')}
          </div>
        `}
      </div>

      <div class="detail-section">
        <h3>Notes & Strategy</h3>
        <div class="detail-notes-card">
          ${job.notes ? this.escape(job.notes).replace(/\n/g, '<br>') : '<span class="text-muted">No notes recorded.</span>'}
        </div>
      </div>
    `;

    content.querySelector('#btn-detail-ics')?.addEventListener('click', () => {
      notifications.downloadIcsFile(job);
    });

    content.querySelector('#btn-detail-edit')?.addEventListener('click', () => {
      modal.classList.remove('active');
      this.openEditModal(job);
    });

    content.querySelector('#btn-detail-delete')?.addEventListener('click', () => {
      if (confirm(`Delete application for ${job.company}?`)) {
        storage.deleteJob(job.id);
        if (cloudSync.syncStatus === 'connected') {
          cloudSync.deleteFromCloud(job.id);
        }
        notifications.showToast(`Deleted ${job.company}`, 'info');
        modal.classList.remove('active');
        this.refreshCurrentView();
      }
    });

    content.querySelectorAll('.detail-chk-box').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const itemId = e.target.dataset.itemId;
        const currentJob = storage.getJob(job.id);
        if (currentJob && currentJob.prepChecklist) {
          const item = currentJob.prepChecklist.find(i => i.id === itemId);
          if (item) {
            item.done = e.target.checked;
            storage.saveJob(currentJob);
            const span = e.target.nextElementSibling;
            if (span) span.classList.toggle('item-done', item.done);
          }
        }
      });
    });

    modal.classList.add('active');
  }

  safeUrl(urlStr) {
    if (!urlStr) return '';
    const trimmed = String(urlStr).trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return this.escape(trimmed);
    }
    return '';
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
