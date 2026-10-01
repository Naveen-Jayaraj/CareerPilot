/**
 * Kanban Pipeline View - Linear Style (No side-scroll lock, pure SVG icons)
 */
import { storage } from './storage.js';
import { notifications } from './notifications.js';
import { icons } from './icons.js';

export const STAGES = [
  { id: 'Wishlist', label: 'Wishlist', color: '#64748b' },
  { id: 'Applied', label: 'Applied', color: '#0ea5e9' },
  { id: 'Shortlisted', label: 'Shortlisted', color: '#6366f1' },
  { id: 'Exam', label: 'OA / Exam', color: '#f59e0b' },
  { id: 'Interview', label: 'Interview', color: '#8b5cf6' },
  { id: 'Offer', label: 'Offer', color: '#10b981' },
  { id: 'Rejected', label: 'Rejected', color: '#f43f5e' }
];

export class KanbanView {
  constructor(container, onEditJob, onOpenDetail) {
    this.container = container;
    this.onEditJob = onEditJob;
    this.onOpenDetail = onOpenDetail;
    this.draggedJobId = null;
    this.activeFilter = 'ALL';
  }

  render() {
    const jobs = storage.getJobs();
    const stats = storage.getStats();

    this.container.innerHTML = `
      <!-- Executive Metric Ribbon -->
      <div class="metric-ribbon">
        <div class="metric-card">
          <span class="metric-card-label">Total Applied</span>
          <span class="metric-card-val">${stats.total}</span>
          <span class="metric-card-sub">All logged</span>
        </div>
        <div class="metric-card">
          <span class="metric-card-label">Shortlisted</span>
          <span class="metric-card-val" style="color: #6366f1;">${stats.shortlisted}</span>
          <span class="metric-card-sub">Screened</span>
        </div>
        <div class="metric-card">
          <span class="metric-card-label">Interviews & OA</span>
          <span class="metric-card-val" style="color: #f59e0b;">${stats.interviewCount}</span>
          <span class="metric-card-sub">Active tests</span>
        </div>
        <div class="metric-card">
          <span class="metric-card-label">Offers</span>
          <span class="metric-card-val" style="color: #10b981;">${stats.offers}</span>
          <span class="metric-card-sub">Secured</span>
        </div>
        <div class="metric-card">
          <span class="metric-card-label">Peak LPA</span>
          <span class="metric-card-val" style="color: #0ea5e9;">${stats.maxLpa}</span>
          <span class="metric-card-sub">Top compensation</span>
        </div>
        <div class="metric-card">
          <span class="metric-card-label">In-Flight</span>
          <span class="metric-card-val">${stats.activePipeline}</span>
          <span class="metric-card-sub">Active pipeline</span>
        </div>
      </div>

      <!-- Action Toolbar -->
      <div class="kanban-toolbar">
        <div class="toolbar-left">
          <div class="search-input-wrap">
            <span class="search-icon">${icons.search}</span>
            <input type="text" id="kanban-search" class="search-input" placeholder="Search company, role, channel..." />
          </div>

          <div class="filter-pills" id="kanban-filter-pills">
            <button class="pill-btn active" data-filter="ALL">All Stages</button>
            <button class="pill-btn" data-filter="ACTIVE">Active Pipeline</button>
            <button class="pill-btn" data-filter="INTERVIEW">Interviews & Tests</button>
            <button class="pill-btn" data-filter="OFFERS">Offers</button>
          </div>
        </div>
      </div>

      <!-- Kanban Responsive Grid -->
      <div class="kanban-grid-container" id="kanban-board"></div>
    `;

    // Filter pills handler
    this.container.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.filter;
        this.renderColumns(jobs);
      });
    });

    document.getElementById('kanban-search')?.addEventListener('input', (e) => {
      this.filterCards(e.target.value.toLowerCase());
    });

    this.renderColumns(jobs);
  }

  renderColumns(jobs) {
    const board = document.getElementById('kanban-board');
    if (!board) return;
    board.innerHTML = '';

    // Filter stages based on selected pill
    let visibleStages = STAGES;
    if (this.activeFilter === 'ACTIVE') {
      visibleStages = STAGES.filter(s => ['Applied', 'Shortlisted', 'Exam', 'Interview'].includes(s.id));
    } else if (this.activeFilter === 'INTERVIEW') {
      visibleStages = STAGES.filter(s => ['Exam', 'Interview'].includes(s.id));
    } else if (this.activeFilter === 'OFFERS') {
      visibleStages = STAGES.filter(s => ['Offer', 'Wishlist'].includes(s.id));
    }

    visibleStages.forEach(stage => {
      const stageJobs = jobs.filter(j => (j.status || 'Applied') === stage.id);
      const colEl = document.createElement('div');
      colEl.className = 'kanban-column';
      colEl.dataset.stage = stage.id;

      colEl.innerHTML = `
        <div class="kanban-column-header">
          <div class="column-title-group">
            <span class="column-status-dot" style="background: ${stage.color};"></span>
            <span class="column-name">${stage.label}</span>
          </div>
          <span class="column-count">${stageJobs.length}</span>
        </div>
        <div class="kanban-card-list" data-stage="${stage.id}"></div>
      `;

      const cardList = colEl.querySelector('.kanban-card-list');

      // Drag & drop handlers
      cardList.addEventListener('dragover', (e) => {
        e.preventDefault();
        cardList.classList.add('drag-over');
      });

      cardList.addEventListener('dragleave', () => {
        cardList.classList.remove('drag-over');
      });

      cardList.addEventListener('drop', (e) => {
        e.preventDefault();
        cardList.classList.remove('drag-over');
        if (this.draggedJobId) {
          storage.updateJobStatus(this.draggedJobId, stage.id);
          notifications.showToast(`Updated to ${stage.label}`, 'success');
          this.render();
        }
      });

      stageJobs.forEach(job => {
        const card = this.createCardElement(job, stage);
        cardList.appendChild(card);
      });

      if (stageJobs.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'kanban-empty-drop';
        emptyState.textContent = 'Empty';
        cardList.appendChild(emptyState);
      }

      board.appendChild(colEl);
    });
  }

  createCardElement(job, stage) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.jobId = job.id;

    // Days active
    let daysActive = '0d';
    if (job.appliedDate) {
      const d = Math.floor((new Date() - new Date(job.appliedDate)) / (1000 * 60 * 60 * 24));
      daysActive = `${d}d`;
    }

    // Milestone badge
    let milestoneBadge = '';
    if (job.nextMilestoneDate) {
      const mDate = new Date(job.nextMilestoneDate);
      const isPast = mDate < new Date();
      const formatted = mDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      milestoneBadge = `
        <div class="card-milestone-pill ${isPast ? 'overdue' : 'upcoming'}">
          ${icons.clock}
          <span>${this.escape(job.milestoneType || 'Milestone')}: ${formatted}</span>
        </div>
      `;
    }

    // Prep progress
    let checklistInfo = '';
    if (job.prepChecklist && job.prepChecklist.length > 0) {
      const done = job.prepChecklist.filter(c => c.done).length;
      checklistInfo = `
        <div class="card-prep-tag">
          ${icons.check} ${done}/${job.prepChecklist.length} prep
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title-group">
          <span class="card-company">${this.escape(job.company)}</span>
          <span class="card-role">${this.escape(job.role || 'Role')}</span>
        </div>
        <button class="card-edit-btn" title="Edit" aria-label="Edit">
          ${icons.pencil}
        </button>
      </div>

      <div class="card-chips">
        ${job.packageLpa && job.packageLpa !== 'NA' ? `<span class="chip chip-salary">${this.escape(job.packageLpa)}</span>` : ''}
        ${job.workMode ? `<span class="chip chip-mode">${this.escape(job.workMode)}</span>` : ''}
        ${job.channel ? `<span class="chip chip-channel">${this.escape(job.channel)}</span>` : ''}
      </div>

      ${milestoneBadge}
      ${checklistInfo}

      <div class="card-footer">
        <span class="card-age font-mono">${daysActive} active</span>
        <div class="card-actions">
          ${job.jobLink ? `
            <a href="${this.escape(job.jobLink)}" target="_blank" rel="noopener noreferrer" class="card-action-btn" title="Job Link" onclick="event.stopPropagation();">
              ${icons.link}
            </a>
          ` : ''}
          <button class="card-action-btn btn-quick-stage" title="Move Stage" onclick="event.stopPropagation();">
            ${icons.arrowRight}
          </button>
        </div>
      </div>
    `;

    // Dragging
    card.addEventListener('dragstart', (e) => {
      this.draggedJobId = job.id;
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', job.id);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      this.draggedJobId = null;
    });

    card.addEventListener('click', (e) => {
      if (!e.target.closest('.card-edit-btn') && !e.target.closest('.card-action-btn') && !e.target.closest('a')) {
        this.onOpenDetail(job);
      }
    });

    card.querySelector('.card-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.onEditJob(job);
    });

    card.querySelector('.btn-quick-stage').addEventListener('click', (e) => {
      e.stopPropagation();
      this.showQuickMoveMenu(e, job);
    });

    return card;
  }

  showQuickMoveMenu(event, job) {
    const existing = document.getElementById('quick-move-popover');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.id = 'quick-move-popover';
    menu.className = 'quick-move-popover';

    const rect = event.currentTarget.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
    menu.style.left = `${Math.min(rect.left + window.scrollX, window.innerWidth - 180)}px`;

    menu.innerHTML = `
      <div class="popover-header">Move Stage</div>
      ${STAGES.map(s => `
        <button class="popover-item ${s.id === job.status ? 'active' : ''}" data-stage="${s.id}">
          <span class="popover-dot" style="background: ${s.color};"></span>
          <span>${s.label}</span>
        </button>
      `).join('')}
    `;

    document.body.appendChild(menu);

    const closeHandler = (e) => {
      if (!menu.contains(e.target) && e.target !== event.currentTarget) {
        menu.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);

    menu.querySelectorAll('.popover-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const newStage = btn.dataset.stage;
        storage.updateJobStatus(job.id, newStage);
        notifications.showToast(`Moved to ${newStage}`, 'success');
        menu.remove();
        this.render();
      });
    });
  }

  filterCards(query) {
    const cards = this.container.querySelectorAll('.kanban-card');
    cards.forEach(c => {
      const text = c.textContent.toLowerCase();
      c.style.display = (!query || text.includes(query)) ? 'flex' : 'none';
    });
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
}
