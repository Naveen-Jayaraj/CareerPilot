/**
 * Interview Preparation Hub - Linear Style (Pure SVG icons)
 */
import { storage } from './storage.js';
import { notifications } from './notifications.js';
import { icons } from './icons.js';

export class PrepView {
  constructor(container, onEditJob) {
    this.container = container;
    this.onEditJob = onEditJob;
  }

  render() {
    const jobs = storage.getJobs();
    const activeJobsWithPrep = jobs.filter(j => 
      (j.prepChecklist && j.prepChecklist.length > 0) || 
      (j.notes && j.notes.trim().length > 0) ||
      ['Exam', 'Interview', 'Shortlisted'].includes(j.status)
    );

    this.container.innerHTML = `
      <div class="prep-header-bar">
        <div>
          <h2 style="font-size: 1.15rem; font-weight: 700;">Interview Prep & Technical Revision</h2>
          <span style="font-size: 0.78rem; color: var(--text-secondary);">Company study tasks, core DSA checklist & STAR behavioral framework</span>
        </div>
      </div>

      <div class="prep-layout-grid">
        <!-- Left: Company Specific Prep Cards -->
        <div class="prep-cards-col">
          <div class="prep-col-title">
            ${icons.briefcase}
            <span>Active Target Companies (${activeJobsWithPrep.length})</span>
          </div>

          ${activeJobsWithPrep.length === 0 ? `
            <div class="prep-empty-card">
              No interview prep tasks logged. Edit any application to add preparation goals!
            </div>
          ` : activeJobsWithPrep.map(job => this.renderCompanyPrepCard(job)).join('')}
        </div>

        <!-- Right: Universal DSA & STAR Toolkit -->
        <div class="prep-toolkit-col">
          <div class="toolkit-panel">
            <div class="toolkit-header">
              <span style="font-weight: 600; font-size: 0.85rem;">DSA Assessment Checklist</span>
              <span class="column-count">9 Topics</span>
            </div>
            <div class="toolkit-checklist" id="dsa-universal-checklist">
              <label class="check-item"><input type="checkbox" id="dsa-arr"> <span>Arrays, Two Pointers & Sliding Window</span></label>
              <label class="check-item"><input type="checkbox" id="dsa-str"> <span>Strings, Hashing & HashMaps</span></label>
              <label class="check-item"><input type="checkbox" id="dsa-ll"> <span>Linked Lists & Fast/Slow Pointers</span></label>
              <label class="check-item"><input type="checkbox" id="dsa-stk"> <span>Stacks & Queues (Monotonic Stack)</span></label>
              <label class="check-item"><input type="checkbox" id="dsa-tree"> <span>Binary Trees & BST Traversals</span></label>
              <label class="check-item"><input type="checkbox" id="dsa-graph"> <span>Graphs: BFS, DFS, Dijkstra</span></label>
              <label class="check-item"><input type="checkbox" id="dsa-dp"> <span>Dynamic Programming: 1D & 2D Memoization</span></label>
              <label class="check-item"><input type="checkbox" id="dsa-sql"> <span>SQL: Joins, Indexing, Group By</span></label>
              <label class="check-item"><input type="checkbox" id="dsa-oops"> <span>OOPs: Polymorphism & Design Patterns</span></label>
            </div>
          </div>

          <div class="toolkit-panel">
            <div class="toolkit-header">
              <span style="font-weight: 600; font-size: 0.85rem;">STAR Behavioral Framework</span>
            </div>
            <div class="star-items-list">
              <div class="star-item"><span class="star-key">S - Situation:</span> Set business & team background</div>
              <div class="star-item"><span class="star-key">T - Task:</span> Identify problem & engineering goal</div>
              <div class="star-item"><span class="star-key">A - Action:</span> Specific technical steps you took</div>
              <div class="star-item"><span class="star-key">R - Result:</span> Quantifiable metrics & impact</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.restoreUniversalChecklist();
  }

  renderCompanyPrepCard(job) {
    const checklist = job.prepChecklist || [];
    return `
      <div class="company-prep-box" data-job-id="${job.id}">
        <div class="cpb-header">
          <div>
            <span class="cpb-company">${this.escape(job.company)}</span>
            <span class="cpb-role">${this.escape(job.role || 'Role')} • ${job.status}</span>
          </div>
          <button class="btn btn-secondary btn-xs btn-edit-prep" data-job-id="${job.id}">
            Edit Prep
          </button>
        </div>

        ${job.notes ? `
          <div class="cpb-notes-content">
            <span class="cpb-notes-label">Strategy / Notes:</span>
            <p>${this.escape(job.notes)}</p>
          </div>
        ` : ''}

        <div class="cpb-checklist">
          ${checklist.length === 0 ? `
            <div class="text-muted" style="font-size: 0.74rem;">No checklist items. Click Edit Prep to add study tasks.</div>
          ` : checklist.map(item => `
            <label class="cpb-check-row">
              <input type="checkbox" class="job-checklist-item" data-job-id="${job.id}" data-item-id="${item.id}" ${item.done ? 'checked' : ''} />
              <span class="${item.done ? 'task-done' : ''}">${this.escape(item.text)}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    this.container.querySelectorAll('.btn-edit-prep').forEach(btn => {
      btn.addEventListener('click', () => {
        const job = storage.getJob(btn.dataset.jobId);
        if (job) this.onEditJob(job);
      });
    });

    this.container.querySelectorAll('.job-checklist-item').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const jobId = e.target.dataset.jobId;
        const itemId = e.target.dataset.itemId;
        const job = storage.getJob(jobId);
        if (job && job.prepChecklist) {
          const item = job.prepChecklist.find(i => i.id === itemId);
          if (item) {
            item.done = e.target.checked;
            storage.saveJob(job);
            const span = e.target.nextElementSibling;
            if (span) {
              span.classList.toggle('task-done', item.done);
            }
          }
        }
      });
    });

    const uniChecklist = this.container.querySelector('#dsa-universal-checklist');
    uniChecklist?.querySelectorAll('input[type="checkbox"]').forEach(box => {
      box.addEventListener('change', () => {
        const saved = JSON.parse(localStorage.getItem('job_hunt_dsa_prep') || '{}');
        saved[box.id] = box.checked;
        localStorage.setItem('job_hunt_dsa_prep', JSON.stringify(saved));
      });
    });
  }

  restoreUniversalChecklist() {
    const saved = JSON.parse(localStorage.getItem('job_hunt_dsa_prep') || '{}');
    Object.entries(saved).forEach(([id, checked]) => {
      const box = this.container.querySelector(`#${id}`);
      if (box) box.checked = checked;
    });
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
}
