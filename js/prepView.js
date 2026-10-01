/**
 * Trello-Style Company Prep Boards
 * Each shortlist / application has a dedicated Trello board with columns:
 * [To Study] -> [In Progress] -> [Revision & Mock] -> [Mastered]
 */
import { storage } from './storage.js';
import { notifications } from './notifications.js';
import { icons } from './icons.js';

export class PrepView {
  constructor(container, onEditJob) {
    this.container = container;
    this.onEditJob = onEditJob;
    this.selectedJobId = null;
    this.activeColumnFilter = 'all';
    this.draggedCard = null; // { jobId, fromColId, cardId }
  }

  render() {
    const jobs = storage.getJobs();

    if (jobs.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state-box">
          <p>No job applications logged yet. Add your first application to start tracking interview prep!</p>
        </div>
      `;
      return;
    }

    // Default to the first job with an upcoming milestone or the first active job
    if (!this.selectedJobId || !jobs.some(j => j.id === this.selectedJobId)) {
      const priorityJob = jobs.find(j => j.status === 'Interview' || j.status === 'Exam' || j.status === 'Shortlisted') || jobs[0];
      this.selectedJobId = priorityJob.id;
    }

    const currentJob = jobs.find(j => j.id === this.selectedJobId) || jobs[0];
    const boardData = this.getOrCreateBoard(currentJob);

    // Calculate progress
    let totalCards = 0;
    let doneCards = 0;
    boardData.columns.forEach(col => {
      totalCards += col.cards.length;
      if (col.id === 'done') doneCards += col.cards.length;
    });
    const progressPct = totalCards > 0 ? Math.round((doneCards / totalCards) * 100) : 0;

    const filterPills = [
      { id: 'all', label: 'All Columns' },
      { id: 'todo', label: 'To Study' },
      { id: 'doing', label: 'In Progress' },
      { id: 'review', label: 'Revision & Mock' },
      { id: 'done', label: 'Mastered' }
    ];

    const visibleCols = this.activeColumnFilter === 'all'
      ? boardData.columns
      : boardData.columns.filter(c => c.id === this.activeColumnFilter);

    this.container.innerHTML = `
      <div class="prep-container">
        <!-- Company Selector Tabs -->
        <div class="prep-header-area">
          <div class="prep-company-tabs-wrap" id="prep-company-tabs">
            ${jobs.map(j => {
              const isSelected = j.id === currentJob.id;
              const jBoard = this.getOrCreateBoard(j);
              const count = jBoard.columns.reduce((acc, c) => acc + c.cards.length, 0);
              return `
                <button class="prep-tab-btn ${isSelected ? 'active' : ''}" data-job-id="${j.id}">
                  <span>${this.escape(j.company)}</span>
                  <span class="prep-tab-badge">${count}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Board Information & Progress Bar -->
        <div class="prep-board-meta">
          <div class="board-info-left">
            <div class="board-target-title">
              <span>${this.escape(currentJob.company)} Prep Board</span>
              <span class="chip chip-mode">${this.escape(currentJob.role || 'Role')}</span>
              <span class="chip" style="background: rgba(99, 102, 241, 0.12); color: #818cf8;">${currentJob.status}</span>
            </div>
            <div class="board-target-subtitle">
              ${currentJob.nextMilestoneDate ? `Next up: ${this.escape(currentJob.milestoneType || 'Milestone')} on ${new Date(currentJob.nextMilestoneDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Dedicated Trello study workspace'}
            </div>
          </div>

          <div class="board-progress-wrap">
            <span class="board-progress-text">${doneCards}/${totalCards} Mastered (${progressPct}%)</span>
            <div class="board-progress-bar">
              <div class="board-progress-fill" style="width: ${progressPct}%;"></div>
            </div>
          </div>
        </div>

        <!-- Column Filter Pills (for focused column view on any display) -->
        <div class="prep-column-filter-pills" id="prep-column-filter-pills">
          ${filterPills.map(p => `
            <button class="prep-col-pill ${this.activeColumnFilter === p.id ? 'active' : ''}" data-col-filter="${p.id}">
              ${p.label}
            </button>
          `).join('')}
        </div>

        <!-- Trello Columns Grid -->
        <div class="trello-board-grid ${this.activeColumnFilter !== 'all' ? 'single-col-view' : ''}" id="trello-board-grid">
          ${visibleCols.map(col => this.renderColumn(col, currentJob)).join('')}
        </div>
      </div>
    `;

    this.attachEventListeners(currentJob);
  }

  renderColumn(col, job) {
    const colIcons = {
      todo: '<span class="status-indicator" style="background: #64748b;"></span>',
      doing: '<span class="status-indicator" style="background: #f59e0b;"></span>',
      review: '<span class="status-indicator" style="background: #8b5cf6;"></span>',
      done: '<span class="status-indicator" style="background: #10b981;"></span>'
    };

    return `
      <div class="trello-col" data-col-id="${col.id}">
        <div class="trello-col-header">
          <div class="trello-col-title">
            ${colIcons[col.id] || ''}
            <span>${col.title}</span>
          </div>
          <span class="column-count">${col.cards.length}</span>
        </div>

        <div class="trello-card-list" data-col-id="${col.id}" id="card-list-${col.id}">
          ${col.cards.map(card => this.renderCard(card, col.id, job)).join('')}
        </div>

        <div class="trello-col-footer" id="footer-${col.id}">
          <button class="btn-add-card" data-col-id="${col.id}">
            ${icons.plus} <span>Add Card</span>
          </button>
        </div>
      </div>
    `;
  }

  renderCard(card, colId, job) {
    const tagClass = `tag-${(card.tag || 'dsa').toLowerCase().replace(/\s+/g, '')}`;

    return `
      <div class="trello-card" draggable="true" data-card-id="${card.id}" data-col-id="${colId}">
        <span class="trello-card-tag ${tagClass}">${this.escape(card.tag || 'DSA')}</span>
        <div class="trello-card-text">${this.escape(card.text)}</div>
        <div class="trello-card-footer">
          <div class="card-move-btns">
            ${colId !== 'todo' ? `
              <button class="btn-card-nav btn-move-left" data-card-id="${card.id}" data-col-id="${colId}" title="Move back">
                ❮
              </button>
            ` : ''}
            ${colId !== 'done' ? `
              <button class="btn-card-nav btn-move-right" data-card-id="${card.id}" data-col-id="${colId}" title="Advance card">
                ❯
              </button>
            ` : ''}
          </div>
          <button class="btn-card-del" data-card-id="${card.id}" data-col-id="${colId}" title="Delete task">
            ${icons.trash}
          </button>
        </div>
      </div>
    `;
  }

  attachEventListeners(currentJob) {
    // Switch between companies
    this.container.querySelectorAll('.prep-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedJobId = btn.dataset.jobId;
        this.render();
      });
    });

    // Column filter pills
    this.container.querySelectorAll('.prep-col-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeColumnFilter = btn.dataset.colFilter;
        this.render();
      });
    });

    // Move left
    this.container.querySelectorAll('.btn-move-left').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.shiftCard(currentJob, btn.dataset.colId, btn.dataset.cardId, -1);
      });
    });

    // Move right
    this.container.querySelectorAll('.btn-move-right').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.shiftCard(currentJob, btn.dataset.colId, btn.dataset.cardId, 1);
      });
    });

    // Delete card
    this.container.querySelectorAll('.btn-card-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteCard(currentJob, btn.dataset.colId, btn.dataset.cardId);
      });
    });

    // Inline Add Card Form
    this.container.querySelectorAll('.btn-add-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const colId = btn.dataset.colId;
        const footer = this.container.querySelector(`#footer-${colId}`);
        if (!footer) return;

        footer.innerHTML = `
          <div class="quick-card-input-box">
            <textarea id="input-card-${colId}" placeholder="Enter revision topic or question..."></textarea>
            <div style="display: flex; gap: 6px; align-items: center;">
              <select id="select-tag-${colId}" class="select-filter" style="padding: 3px 6px; font-size: 0.72rem;">
                <option value="DSA">DSA</option>
                <option value="System">System Design</option>
                <option value="Core">Core CS / SQL</option>
                <option value="Behavioral">Behavioral / HR</option>
                <option value="General">General</option>
              </select>
              <div class="quick-card-actions" style="margin-left: auto;">
                <button class="btn btn-secondary btn-xs btn-cancel-card">Cancel</button>
                <button class="btn btn-primary btn-xs btn-confirm-card">Add</button>
              </div>
            </div>
          </div>
        `;

        const textarea = footer.querySelector('textarea');
        textarea?.focus();

        footer.querySelector('.btn-cancel-card').onclick = () => {
          this.render();
        };

        footer.querySelector('.btn-confirm-card').onclick = () => {
          const text = textarea.value.trim();
          const tag = footer.querySelector(`#select-tag-${colId}`).value;
          if (text) {
            this.addCard(currentJob, colId, text, tag);
          }
        };
      });
    });

    // HTML5 Drag and drop
    this.container.querySelectorAll('.trello-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        this.draggedCard = {
          jobId: currentJob.id,
          fromColId: card.dataset.colId,
          cardId: card.dataset.cardId
        };
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.dataset.cardId);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        this.draggedCard = null;
      });
    });

    this.container.querySelectorAll('.trello-card-list').forEach(list => {
      list.addEventListener('dragover', (e) => {
        e.preventDefault();
        list.classList.add('drag-over');
      });

      list.addEventListener('dragleave', () => {
        list.classList.remove('drag-over');
      });

      list.addEventListener('drop', (e) => {
        e.preventDefault();
        list.classList.remove('drag-over');
        if (this.draggedCard && this.draggedCard.fromColId !== list.dataset.colId) {
          this.moveCardToColumn(currentJob, this.draggedCard.fromColId, list.dataset.colId, this.draggedCard.cardId);
        }
      });
    });
  }

  shiftCard(job, currentColId, cardId, direction) {
    const colOrder = ['todo', 'doing', 'review', 'done'];
    const currentIdx = colOrder.indexOf(currentColId);
    const targetIdx = currentIdx + direction;
    if (targetIdx >= 0 && targetIdx < colOrder.length) {
      this.moveCardToColumn(job, currentColId, colOrder[targetIdx], cardId);
    }
  }

  moveCardToColumn(job, fromColId, toColId, cardId) {
    const board = this.getOrCreateBoard(job);
    const fromCol = board.columns.find(c => c.id === fromColId);
    const toCol = board.columns.find(c => c.id === toColId);
    if (!fromCol || !toCol) return;

    const cardIdx = fromCol.cards.findIndex(c => c.id === cardId);
    if (cardIdx === -1) return;

    const [card] = fromCol.cards.splice(cardIdx, 1);
    toCol.cards.push(card);

    job.prepBoard = board;
    storage.saveJob(job);
    notifications.playChime('success');
    this.render();
  }

  addCard(job, colId, text, tag) {
    const board = this.getOrCreateBoard(job);
    const col = board.columns.find(c => c.id === colId);
    if (!col) return;

    col.cards.push({
      id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text,
      tag: tag || 'DSA',
      createdAt: new Date().toISOString()
    });

    job.prepBoard = board;
    storage.saveJob(job);
    notifications.showToast(`Added card to ${col.title}`, 'success');
    this.render();
  }

  deleteCard(job, colId, cardId) {
    const board = this.getOrCreateBoard(job);
    const col = board.columns.find(c => c.id === colId);
    if (!col) return;

    col.cards = col.cards.filter(c => c.id !== cardId);
    job.prepBoard = board;
    storage.saveJob(job);
    this.render();
  }

  getOrCreateBoard(job) {
    if (job.prepBoard && Array.isArray(job.prepBoard.columns) && job.prepBoard.columns.length === 4) {
      return job.prepBoard;
    }

    // Default template tailored for this company
    const defaultCols = [
      { id: 'todo', title: 'To Study', cards: [] },
      { id: 'doing', title: 'In Progress', cards: [] },
      { id: 'review', title: 'Revision & Mock', cards: [] },
      { id: 'done', title: 'Mastered', cards: [] }
    ];

    // Seed cards from checklist or company default
    if (job.company.toLowerCase().includes('accenture')) {
      defaultCols[0].cards.push(
        { id: 'acc_1', text: 'Watch Accenture interview experiences & behavioral questions', tag: 'Behavioral' },
        { id: 'acc_2', text: 'Prepare STAR stories for HR managerial round', tag: 'Behavioral' }
      );
      defaultCols[1].cards.push(
        { id: 'acc_3', text: 'DBMS, Normalization & SQL Queries revision', tag: 'Core' },
        { id: 'acc_4', text: 'OOPs Principles: Polymorphism, Abstraction, Inheritance', tag: 'Core' }
      );
      defaultCols[2].cards.push(
        { id: 'acc_5', text: 'Cognitive & Critical Reasoning practice assessment', tag: 'General' }
      );
      defaultCols[3].cards.push(
        { id: 'acc_6', text: 'Core DSA: Array, String, LinkedList & Stack', tag: 'DSA' }
      );
    } else if (job.company.toLowerCase().includes('booking')) {
      defaultCols[0].cards.push(
        { id: 'bk_1', text: 'System Design basics: Caching, CDN & Load Balancers', tag: 'System' },
        { id: 'bk_2', text: 'Microservices architecture overview', tag: 'System' }
      );
      defaultCols[1].cards.push(
        { id: 'bk_3', text: 'Dynamic Programming on Trees & Graphs', tag: 'DSA' }
      );
      defaultCols[2].cards.push(
        { id: 'bk_4', text: 'Hackerrank timed coding assessment practice test', tag: 'DSA' }
      );
      defaultCols[3].cards.push(
        { id: 'bk_5', text: 'Two Pointers & Sliding Window Mediums', tag: 'DSA' }
      );
    } else if (job.company.toLowerCase().includes('goldman')) {
      defaultCols[0].cards.push(
        { id: 'gs_1', text: 'Review Math & Probability puzzles', tag: 'Core' },
        { id: 'gs_2', text: 'Financial market & trading domain overview', tag: 'General' }
      );
      defaultCols[1].cards.push(
        { id: 'gs_3', text: 'LeetCode Medium: Binary Search & Heaps', tag: 'DSA' }
      );
      defaultCols[2].cards.push(
        { id: 'gs_4', text: 'Campus Aptitude & Reasoning mock test', tag: 'General' }
      );
      defaultCols[3].cards.push(
        { id: 'gs_5', text: 'Bit Manipulation & String Algorithms', tag: 'DSA' }
      );
    } else if (job.company.toLowerCase().includes('bright')) {
      defaultCols[0].cards.push(
        { id: 'bm_1', text: 'Python concurrency: Asyncio & Multithreading', tag: 'Core' },
        { id: 'bm_2', text: 'REST API design principles & rate limiting', tag: 'System' }
      );
      defaultCols[1].cards.push(
        { id: 'bm_3', text: 'Database Indexing, B-Trees & Query Optimization', tag: 'Core' }
      );
      defaultCols[2].cards.push(
        { id: 'bm_4', text: 'Backend system architecture walkthrough', tag: 'System' }
      );
      defaultCols[3].cards.push(
        { id: 'bm_5', text: 'Python Data Structures & OOPs', tag: 'Core' }
      );
    } else {
      // Generic seed
      defaultCols[0].cards.push(
        { id: 'gen_1', text: 'Review company tech stack & recent engineering blogs', tag: 'General' },
        { id: 'gen_2', text: 'Prepare STAR stories for behavioral questions', tag: 'Behavioral' }
      );
      defaultCols[1].cards.push(
        { id: 'gen_3', text: 'Practice LeetCode medium questions', tag: 'DSA' }
      );
      defaultCols[3].cards.push(
        { id: 'gen_4', text: 'Resume walkthrough and past project deep dive', tag: 'General' }
      );
    }

    job.prepBoard = { columns: defaultCols };
    storage.saveJob(job);
    return job.prepBoard;
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
}
