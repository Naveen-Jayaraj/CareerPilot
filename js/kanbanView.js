/**
 * Kanban Pipeline View - Drag-and-Drop & Mobile Touch Friendly
 */
import { storage } from './storage.js';
import { notifications } from './notifications.js';

export const STAGES = [
  { id: 'Wishlist', label: 'Wishlist', color: '#94a3b8', icon: '⭐' },
  { id: 'Applied', label: 'Applied', color: '#38bdf8', icon: '📨' },
  { id: 'Shortlisted', label: 'Shortlisted', color: '#818cf8', icon: '🎯' },
  { id: 'Exam', label: 'Exam / OA', color: '#f59e0b', icon: '📝' },
  { id: 'Interview', label: 'Interview', color: '#a855f7', icon: '💼' },
  { id: 'Offer', label: 'Offer / Placed', color: '#10b981', icon: '🎉' },
  { id: 'Rejected', label: 'Rejected', color: '#ef4444', icon: '📁' }
];

export class KanbanView {
  constructor(container, onEditJob, onOpenDetail) {
    this.container = container;
    this.onEditJob = onEditJob;
    this.onOpenDetail = onOpenDetail;
    this.draggedJobId = null;
  }

  render() {
    const jobs = storage.getJobs();
    this.container.innerHTML = `
      <div class="kanban-header-bar">
        <div class="kanban-title-group">
          <h2>Application Pipeline</h2>
          <span class="kanban-subtitle">Drag & drop or tap to advance applications</span>
        </div>
        <div class="kanban-actions">
          <input type="text" id="kanban-search" class="search-input" placeholder="Search company or role..." />
          <button id="kanban-add-btn" class="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Job
          </button>
        </div>
      </div>
      <div class="kanban-board" id="kanban-board"></div>
    `;

    document.getElementById('kanban-search').addEventListener('input', (e) => {
      this.filterCards(e.target.value.toLowerCase());
    });

    document.getElementById('kanban-add-btn').addEventListener('click', () => {
      this.onEditJob(null);
    });

    const board = document.getElementById('kanban-board');

    STAGES.forEach(stage => {
      const stageJobs = jobs.filter(j => (j.status || 'Applied') === stage.id);
      const colEl = document.createElement('div');
      colEl.className = 'kanban-col';
      colEl.dataset.stage = stage.id;

      colEl.innerHTML = `
        <div class="kanban-col-header" style="border-top: 3px solid ${stage.color};">
          <div class="kanban-col-title">
            <span class="stage-icon">${stage.icon}</span>
            <span class="stage-name">${stage.label}</span>
            <span class="stage-count">${stageJobs.length}</span>
          </div>
        </div>
        <div class="kanban-card-list" data-stage="${stage.id}" id="col-${stage.id}"></div>
      `;

      const cardList = colEl.querySelector('.kanban-card-list');

      // Drag and drop event listeners on column
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
          notifications.showToast(`Moved to ${stage.label}`, 'success');
          notifications.playChime('success');
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
        emptyState.textContent = 'Drop cards here';
        cardList.appendChild(emptyState);
      }

      board.appendChild(colEl);
    });
  }

  createCardElement(job, currentStage) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.jobId = job.id;

    // Calculate days active
    let daysActive = 0;
    if (job.appliedDate) {
      daysActive = Math.floor((new Date() - new Date(job.appliedDate)) / (1000 * 60 * 60 * 24));
    }

    // Milestone badge
    let milestoneBadge = '';
    if (job.nextMilestoneDate) {
      const mDate = new Date(job.nextMilestoneDate);
      const isPast = mDate < new Date();
      const formattedDate = mDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      milestoneBadge = `
        <div class="card-milestone ${isPast ? 'overdue' : 'upcoming'}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>${job.milestoneType || 'Milestone'}: ${formattedDate}</span>
        </div>
      `;
    }

    // Checklist progress
    let checklistInfo = '';
    if (job.prepChecklist && job.prepChecklist.length > 0) {
      const doneCount = job.prepChecklist.filter(c => c.done).length;
      checklistInfo = `
        <div class="card-checklist-pill">
          ✓ ${doneCount}/${job.prepChecklist.length} prep done
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-top">
        <h4 class="card-company">${this.escape(job.company)}</h4>
        <div class="card-quick-actions">
          <button class="btn-icon card-edit-btn" title="Edit Application">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
        </div>
      </div>
      <div class="card-role">${this.escape(job.role || 'Position')}</div>
      
      <div class="card-tags">
        ${job.packageLpa && job.packageLpa !== 'NA' ? `<span class="tag tag-salary">${this.escape(job.packageLpa)}</span>` : ''}
        ${job.workMode ? `<span class="tag tag-mode">${this.escape(job.workMode)}</span>` : ''}
        ${job.channel ? `<span class="tag tag-channel">${this.escape(job.channel)}</span>` : ''}
      </div>

      ${milestoneBadge}
      ${checklistInfo}

      <div class="card-footer">
        <span class="card-days-ago">${daysActive === 0 ? 'Today' : `${daysActive}d active`}</span>
        <div class="card-footer-btns">
          ${job.jobLink ? `
            <a href="${this.escape(job.jobLink)}" target="_blank" rel="noopener noreferrer" class="card-link-btn" title="Open Job Link" onclick="event.stopPropagation();">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          ` : ''}
          <button class="stage-shift-btn" title="Quick Move Stage" onclick="event.stopPropagation();">
            ➔
          </button>
        </div>
      </div>
    `;

    // Drag events
    card.addEventListener('dragstart', (e) => {
      this.draggedJobId = job.id;
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', job.id);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      this.draggedJobId = null;
    });

    // Tap on card body opens detail modal
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.card-edit-btn') && !e.target.closest('.stage-shift-btn') && !e.target.closest('a')) {
        this.onOpenDetail(job);
      }
    });

    card.querySelector('.card-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.onEditJob(job);
    });

    card.querySelector('.stage-shift-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.showQuickMoveMenu(e, job);
    });

    return card;
  }

  showQuickMoveMenu(event, job) {
    const existingMenu = document.getElementById('quick-move-popover');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.id = 'quick-move-popover';
    menu.className = 'quick-move-popover';

    const rect = event.currentTarget.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 6}px`;
    menu.style.left = `${Math.min(rect.left + window.scrollX, window.innerWidth - 200)}px`;

    menu.innerHTML = `
      <div class="popover-title">Move to:</div>
      ${STAGES.map(s => `
        <button class="popover-item ${s.id === job.status ? 'active' : ''}" data-stage="${s.id}">
          <span>${s.icon}</span> <span>${s.label}</span>
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
        notifications.showToast(`Updated to ${newStage}`, 'success');
        menu.remove();
        this.render();
      });
    });
  }

  filterCards(query) {
    const cards = this.container.querySelectorAll('.kanban-card');
    cards.forEach(c => {
      const text = c.textContent.toLowerCase();
      if (!query || text.includes(query)) {
        c.style.display = 'flex';
      } else {
        c.style.display = 'none';
      }
    });
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
}
