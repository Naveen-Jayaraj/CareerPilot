/**
 * Interview Preparation & Notes Hub
 * Dedicated section for DSA checklists, company prep notes, and STAR behavioral answers.
 */
import { storage } from './storage.js';
import { notifications } from './notifications.js';

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
      <div class="prep-header">
        <div>
          <h2>Interview Prep & Study Hub</h2>
          <span class="prep-subtitle">Track your DSA revision, technical topics, company questions and STAR stories</span>
        </div>
      </div>

      <div class="prep-grid">
        <!-- Left: Company Specific Prep Cards -->
        <div class="prep-main-col">
          <div class="prep-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            Active Company Prep Workspaces (${activeJobsWithPrep.length})
          </div>

          ${activeJobsWithPrep.length === 0 ? `
            <div class="prep-empty">
              No active interview preparation items yet. Add prep tasks or notes to any application!
            </div>
          ` : activeJobsWithPrep.map(job => this.renderCompanyPrepCard(job)).join('')}
        </div>

        <!-- Right: Universal DSA & Behavioral Toolkit -->
        <div class="prep-side-col">
          <div class="prep-toolkit-card">
            <h3>🎯 High-Yield DSA Checklist</h3>
            <p class="text-sm text-muted">Essential topics for coding assessments & tech interviews</p>
            <div class="toolkit-checklist" id="dsa-universal-checklist">
              <label class="check-item"><input type="checkbox" id="dsa-arr"> <span>Arrays, Two Pointers & Sliding Window</span></label>
              <label class="check-item"><input type="checkbox" id="dsa-str"> <span>Strings, Hashing & HashMaps</span></label>
              <label class="check-item"><input type="checkbox" id="dsa-ll"> <span>Linked Lists & Two Pointer Fast/Slow</span></label>
              <label class="check-item"><input type="checkbox" id="dsa-stk"> <span>Stacks & Queues (Monotonic Stack)</span></label>
              <label class="check-item"><input type="checkbox" id="dsa-tree"> <span>Binary Trees, BST & Tree Traversals (DFS/BFS)</span></label>
              <label class="check-item"><input type="checkbox" id="dsa-graph"> <span>Graphs: BFS, DFS, Dijkstra, Cycle Detection</span></label>
              <label class="check-item"><input type="checkbox" id="dsa-dp"> <span>Dynamic Programming: 1D & 2D Memoization</span></label>
              <label class="check-item"><input type="checkbox" id="dsa-sql"> <span>SQL: Joins, Indexing, Group By, Window Functions</span></label>
              <label class="check-item"><input type="checkbox" id="dsa-oops"> <span>OOPs Principles: Polymorphism, Inheritance, Design Patterns</span></label>
            </div>
          </div>

          <div class="prep-toolkit-card">
            <h3>⭐ STAR Method Helper</h3>
            <p class="text-sm text-muted">Structure your behavioral interview answers cleanly:</p>
            <div class="star-pill-list">
              <div class="star-pill"><strong>S - Situation:</strong> Set the context and business background</div>
              <div class="star-pill"><strong>T - Task:</strong> State the problem and your exact goal</div>
              <div class="star-pill"><strong>A - Action:</strong> Explain the technical steps YOU took</div>
              <div class="star-pill"><strong>R - Result:</strong> Share quantifiable metrics and impact</div>
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
      <div class="company-prep-card" data-job-id="${job.id}">
        <div class="cpp-header">
          <div>
            <h4 class="cpp-company">${this.escape(job.company)}</h4>
            <span class="cpp-role">${this.escape(job.role || 'Role')} • <span class="tag-status">${job.status}</span></span>
          </div>
          <button class="btn btn-secondary btn-sm btn-edit-prep" data-job-id="${job.id}">
            Edit Checklist
          </button>
        </div>

        ${job.notes ? `
          <div class="cpp-notes-box">
            <strong>Notes / Instructions:</strong>
            <p>${this.escape(job.notes)}</p>
          </div>
        ` : ''}

        <div class="cpp-checklist">
          <h5>Checklist & Action Items:</h5>
          ${checklist.length === 0 ? `
            <div class="text-muted text-sm">No checklist items yet. Click Edit Checklist to add topics to study.</div>
          ` : checklist.map(item => `
            <label class="prep-check-row">
              <input type="checkbox" class="job-checklist-item" data-job-id="${job.id}" data-item-id="${item.id}" ${item.done ? 'checked' : ''} />
              <span class="${item.done ? 'item-done' : ''}">${this.escape(item.text)}</span>
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

    this.container.querySelectorAll('.job-checklist-item').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const jobId = e.target.dataset.jobId;
        const itemId = e.target.dataset.itemId;
        const job = storage.getJob(jobId);
        if (job && job.prepChecklist) {
          const item = job.prepChecklist.find(i => i.id === itemId);
          if (item) {
            item.done = e.target.checked;
            storage.saveJob(job);
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

    // Save universal checklist in localStorage
    const uniChecklist = this.container.querySelector('#dsa-universal-checklist');
    uniChecklist?.querySelectorAll('input[type="checkbox"]').forEach(box => {
      box.addEventListener('change', () => {
        const saved = JSON.parse(localStorage.getItem('job_hunt_dsa_prep') || '{}');
        saved[box.id] = box.checked;
        localStorage.setItem('job_hunt_dsa_prep', JSON.stringify(saved));
        notifications.playChime('success');
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
