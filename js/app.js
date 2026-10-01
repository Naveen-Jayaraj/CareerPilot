/**
 * Main Application Coordinator
 * State management, view switching, modals, cloud sync, and PWA registration
 */
import { storage } from './storage.js';
import { cloudSync } from './cloudSync.js';
import { notifications } from './notifications.js';
import { STAGES, KanbanView } from './kanbanView.js';
import { TableView } from './tableView.js';
import { CalendarView } from './calendarView.js';
import { StatsView } from './statsView.js';
import { PrepView } from './prepView.js';

class App {
  constructor() {
    this.currentView = 'kanban';
    this.editingJob = null;
    this.views = {};
    this.init();
  }

  init() {
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('PWA Service Worker registered:', reg.scope))
          .catch(err => console.log('Service Worker registration skipped/failed:', err));
      });
    }

    // Apply saved theme
    this.applyTheme(storage.getSettings().theme || 'cyber-dark');

    // Setup views
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

    // Initial render
    this.switchView('kanban');

    // Global navigation event listeners
    this.setupNavigation();
    this.setupModals();
    this.setupHeaderActions();
    this.setupCloudSyncIndicator();

    // Listen to data updates
    window.addEventListener('jobs-updated', () => {
      this.refreshCurrentView();
    });

    window.addEventListener('cloud-sync-status', (e) => {
      this.updateCloudStatusUi(e.detail);
    });
  }

  switchView(viewName) {
    this.currentView = viewName;

    // Update active nav links (desktop sidebar & mobile bottom bar)
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === viewName);
    });

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

    // Mobile FAB
    document.getElementById('mobile-fab-add')?.addEventListener('click', () => {
      this.openEditModal(null);
    });

    // Header Add Button
    document.getElementById('header-add-btn')?.addEventListener('click', () => {
      this.openEditModal(null);
    });
  }

  setupHeaderActions() {
    // Notification Drawer
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

    // Cloud Sync Modal Button
    document.getElementById('btn-cloud-sync')?.addEventListener('click', () => {
      this.openCloudModal();
    });

    // Theme Toggle
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
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
          <span style="font-size: 2rem;">🔔</span>
          <h4>You are all caught up!</h4>
          <p class="text-muted text-sm">No upcoming milestone deadlines or urgent interviews at the moment.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = reminders.map(r => {
      let icon = '📅';
      if (r.type === 'milestone-today') icon = '⚡';
      if (r.type === 'milestone-overdue') icon = '⚠️';
      if (r.type === 'nudge-followup') icon = '💡';

      return `
        <div class="drawer-notification-item urgency-${r.urgency}" data-job-id="${r.jobId}">
          <div class="dn-icon">${icon}</div>
          <div class="dn-content">
            <h5 class="dn-title">${r.title}</h5>
            <p class="dn-msg">${r.message}</p>
            <div class="dn-actions">
              <button class="btn btn-primary btn-xs btn-open-job-from-notif" data-job-id="${r.jobId}">View Application</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.btn-open-job-from-notif').forEach(btn => {
      btn.addEventListener('click', () => {
        const drawer = document.getElementById('notification-drawer');
        const backdrop = document.getElementById('drawer-backdrop');
        drawer.classList.remove('open');
        backdrop.classList.remove('open');
        const job = storage.getJob(btn.dataset.jobId);
        if (job) this.openDetailModal(job);
      });
    });

    // Request native permission button
    const permBtn = document.getElementById('btn-enable-native-notifs');
    if (permBtn) {
      if ('Notification' in window && Notification.permission === 'granted') {
        permBtn.textContent = '✓ System Notifications Active';
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

  // ==================== MODAL MANAGEMENT ====================

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

    // Save job form submit
    document.getElementById('job-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveJobForm();
    });

    // Add prep checklist item inside edit form
    document.getElementById('btn-add-form-checklist-item')?.addEventListener('click', () => {
      this.appendFormChecklistRow('', false);
    });

    // Cloud modal submit
    document.getElementById('cloud-sync-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSaveCloudConfig();
    });

    document.getElementById('btn-disconnect-cloud')?.addEventListener('click', () => {
      cloudSync.disconnect();
      notifications.showToast('Disconnected from Supabase. Reverted to Local Vault.', 'info');
      cloudModal.classList.remove('active');
    });

    // Cloud modal backup triggers
    document.getElementById('btn-modal-export-json')?.addEventListener('click', () => {
      storage.exportJSON();
      notifications.showToast('Downloaded JSON backup', 'success');
    });

    document.getElementById('btn-modal-export-csv')?.addEventListener('click', () => {
      storage.exportCSV();
      notifications.showToast('Downloaded CSV / Excel file', 'success');
    });

    // File import trigger
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
          notifications.showToast(`Imported ${count} applications successfully!`, 'success');
          cloudModal.classList.remove('active');
          this.refreshCurrentView();
        } catch (err) {
          notifications.showToast('Failed to parse backup file. Must be valid JSON.', 'warning');
        }
      };
      reader.readAsText(file);
    });
  }

  openEditModal(job = null) {
    this.editingJob = job;
    const modal = document.getElementById('job-edit-modal');
    const title = document.getElementById('edit-modal-title');
    title.textContent = job ? `Edit: ${job.company}` : 'Add New Application';

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

    // Checklist rows
    const checklistContainer = document.getElementById('form-checklist-container');
    checklistContainer.innerHTML = '';
    const checklist = job && job.prepChecklist ? job.prepChecklist : [];
    if (checklist.length === 0) {
      this.appendFormChecklistRow('Review DSA & algorithms', false);
      this.appendFormChecklistRow('Research company & tech stack', false);
    } else {
      checklist.forEach(item => this.appendFormChecklistRow(item.text, item.done));
    }

    modal.classList.add('active');
  }

  appendFormChecklistRow(text = '', done = false) {
    const container = document.getElementById('form-checklist-container');
    const row = document.createElement('div');
    row.className = 'form-checklist-row';
    row.innerHTML = `
      <input type="checkbox" class="form-chk-done" ${done ? 'checked' : ''} />
      <input type="text" class="form-chk-text form-input" placeholder="e.g. Study DSA, System design" value="${text.replace(/"/g, '&quot;')}" />
      <button type="button" class="btn-remove-chk">&times;</button>
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

    // Collect checklist items
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

    // Keep existing interview rounds if editing
    if (this.editingJob && this.editingJob.interviewRounds) {
      jobData.interviewRounds = this.editingJob.interviewRounds;
    }

    const saved = storage.saveJob(jobData);

    // Sync to cloud if connected
    if (cloudSync.syncStatus === 'connected') {
      cloudSync.pushSingleJob(saved);
    }

    notifications.showToast(id ? `Updated ${company}` : `Added ${company} to tracker!`, 'success');
    notifications.playChime('success');

    document.getElementById('job-edit-modal').classList.remove('active');
    this.refreshCurrentView();
  }

  openDetailModal(job) {
    const modal = document.getElementById('job-detail-modal');
    const content = document.getElementById('detail-modal-body');

    let daysActive = '-';
    if (job.appliedDate) {
      daysActive = `${Math.floor((new Date() - new Date(job.appliedDate)) / (1000 * 60 * 60 * 24))} days active`;
    }

    const gCalUrl = notifications.getGoogleCalendarUrl(job);
    const stageObj = STAGES.find(s => s.id === job.status) || STAGES[1];

    content.innerHTML = `
      <div class="detail-header-card" style="border-left: 5px solid ${stageObj.color};">
        <div class="dh-top">
          <div>
            <h2 class="dh-company">${this.escape(job.company)}</h2>
            <div class="dh-role">${this.escape(job.role || 'Unspecified Role')}</div>
          </div>
          <span class="dh-status-badge" style="background: ${stageObj.color}22; color: ${stageObj.color}; border: 1px solid ${stageObj.color};">
            ${stageObj.icon} ${stageObj.label}
          </span>
        </div>
        <div class="dh-meta-row">
          <span>💰 <strong>${this.escape(job.packageLpa || 'Not Disclosed')}</strong></span>
          <span>📍 <strong>${this.escape(job.location || job.workMode || 'On-site')}</strong></span>
          <span>📅 Applied: <strong>${job.appliedDate || '-'}</strong> (${daysActive})</span>
          <span>🏷️ Channel: <strong>${this.escape(job.channel || 'Direct')}</strong></span>
        </div>
      </div>

      <!-- Milestone Banner -->
      ${job.nextMilestoneDate ? `
        <div class="detail-milestone-box">
          <div class="dmb-left">
            <div class="dmb-title">⏰ Next Milestone: ${this.escape(job.milestoneType || 'Milestone')}</div>
            <div class="dmb-time">${new Date(job.nextMilestoneDate).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}</div>
          </div>
          <div class="dmb-right">
            ${gCalUrl ? `
              <a href="${gCalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
                + Google Calendar
              </a>
            ` : ''}
            <button class="btn btn-secondary btn-sm" id="btn-detail-ics">
              Download .ics
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Quick Action Buttons -->
      <div class="detail-quick-actions">
        ${job.jobLink ? `
          <a href="${this.escape(job.jobLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
            Open Job Application Portal ↗
          </a>
        ` : ''}
        <button class="btn btn-secondary btn-sm" id="btn-detail-edit">Edit Application</button>
        <button class="btn btn-secondary btn-sm" id="btn-detail-delete" style="color: #ef4444;">Delete</button>
      </div>

      <!-- Prep Checklist -->
      <div class="detail-section">
        <h3>Preparation Tasks (${job.prepChecklist ? job.prepChecklist.length : 0})</h3>
        ${(!job.prepChecklist || job.prepChecklist.length === 0) ? `
          <p class="text-muted text-sm">No preparation tasks configured. Click Edit Application to add study goals.</p>
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

      <!-- Notes -->
      <div class="detail-section">
        <h3>Notes & Strategy</h3>
        <div class="detail-notes-card">
          ${job.notes ? this.escape(job.notes).replace(/\n/g, '<br>') : '<span class="text-muted">No notes recorded yet.</span>'}
        </div>
      </div>
    `;

    // Attach listeners
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
            notifications.playChime('success');
            const span = e.target.nextElementSibling;
            if (span) {
              if (item.done) span.classList.add('item-done');
              else span.classList.remove('item-done');
            }
          }
        }
      });
    });

    modal.classList.add('active');
  }

  openCloudModal() {
    const modal = document.getElementById('cloud-sync-modal');
    const settings = storage.getSettings();
    document.getElementById('cloud-url-input').value = settings.supabaseUrl || '';
    document.getElementById('cloud-key-input').value = settings.supabaseAnonKey || '';
    modal.classList.add('active');
  }

  async handleSaveCloudConfig() {
    const url = document.getElementById('cloud-url-input').value.trim();
    const key = document.getElementById('cloud-key-input').value.trim();
    const statusText = document.getElementById('cloud-modal-status-text');

    if (!url || !key) {
      notifications.showToast('Please provide both Supabase URL and Anon Key', 'warning');
      return;
    }

    statusText.textContent = 'Connecting and syncing database...';
    statusText.style.color = '#38bdf8';

    const res = await cloudSync.connect(url, key);
    if (res.success) {
      statusText.textContent = '✓ Connected and verified with Supabase cloud!';
      statusText.style.color = '#10b981';
      notifications.showToast('Supabase Cloud Sync is now active!', 'success');
      notifications.playChime('success');
      setTimeout(() => {
        document.getElementById('cloud-sync-modal').classList.remove('active');
      }, 1200);
      this.refreshCurrentView();
    } else {
      statusText.textContent = `Error: ${res.error}`;
      statusText.style.color = '#ef4444';
      notifications.showToast(res.error, 'warning');
    }
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
