/**
 * Dense Table View - Linear Style
 * Pure SVG icons, zero emojis, fast filtering, instant inline status change
 */
import { storage } from './storage.js';
import { notifications } from './notifications.js';
import { STAGES } from './kanbanView.js';
import { icons } from './icons.js';

export class TableView {
  constructor(container, onEditJob, onOpenDetail) {
    this.container = container;
    this.onEditJob = onEditJob;
    this.onOpenDetail = onOpenDetail;
    this.sortField = 'appliedDate';
    this.sortAsc = false;
    this.searchQuery = '';
    this.statusFilter = 'ALL';
    this.modeFilter = 'ALL';
  }

  render() {
    let jobs = storage.getJobs();
    const stats = storage.getStats();

    // Filtering
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      jobs = jobs.filter(j => 
        (j.company && j.company.toLowerCase().includes(q)) ||
        (j.role && j.role.toLowerCase().includes(q)) ||
        (j.channel && j.channel.toLowerCase().includes(q)) ||
        (j.notes && j.notes.toLowerCase().includes(q))
      );
    }

    if (this.statusFilter !== 'ALL') {
      jobs = jobs.filter(j => j.status === this.statusFilter);
    }

    if (this.modeFilter !== 'ALL') {
      jobs = jobs.filter(j => j.workMode === this.modeFilter);
    }

    // Sorting
    jobs.sort((a, b) => {
      let valA = a[this.sortField];
      let valB = b[this.sortField];

      if (this.sortField === 'packageNumeric') {
        valA = a.packageNumeric || 0;
        valB = b.packageNumeric || 0;
      } else if (this.sortField === 'daysActive') {
        valA = a.appliedDate ? new Date(a.appliedDate).getTime() : 0;
        valB = b.appliedDate ? new Date(b.appliedDate).getTime() : 0;
        return this.sortAsc ? valB - valA : valA - valB;
      }

      if (typeof valA === 'string') {
        const comp = valA.localeCompare(valB || '');
        return this.sortAsc ? comp : -comp;
      } else {
        valA = valA || 0;
        valB = valB || 0;
        return this.sortAsc ? valA - valB : valB - valA;
      }
    });

    this.container.innerHTML = `
      <!-- Metric Ribbon -->
      <div class="metric-ribbon">
        <div class="metric-card">
          <span class="metric-card-label">Total Applied</span>
          <span class="metric-card-val">${stats.total}</span>
          <span class="metric-card-sub">All logged</span>
        </div>
        <div class="metric-card">
          <span class="metric-card-label">Shortlisted</span>
          <span class="metric-card-val" style="color: #6366f1;">${stats.shortlisted}</span>
          <span class="metric-card-sub">Passed screen</span>
        </div>
        <div class="metric-card">
          <span class="metric-card-label">Interviews & OA</span>
          <span class="metric-card-val" style="color: #f59e0b;">${stats.interviewCount}</span>
          <span class="metric-card-sub">In evaluation</span>
        </div>
        <div class="metric-card">
          <span class="metric-card-label">Offers</span>
          <span class="metric-card-val" style="color: #10b981;">${stats.offers}</span>
          <span class="metric-card-sub">Secured</span>
        </div>
        <div class="metric-card">
          <span class="metric-card-label">Peak LPA</span>
          <span class="metric-card-val" style="color: #0ea5e9;">${stats.maxLpa}</span>
          <span class="metric-card-sub">Highest package</span>
        </div>
        <div class="metric-card">
          <span class="metric-card-label">In-Flight</span>
          <span class="metric-card-val">${stats.activePipeline}</span>
          <span class="metric-card-sub">Active pipeline</span>
        </div>
      </div>

      <!-- Table Toolbar -->
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <div class="search-input-wrap">
            <span class="search-icon">${icons.search}</span>
            <input type="text" id="table-search" placeholder="Search applications..." value="${this.escape(this.searchQuery)}" />
          </div>

          <select id="table-filter-status" class="select-filter">
            <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
            ${STAGES.map(s => `<option value="${s.id}" ${this.statusFilter === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>

          <select id="table-filter-mode" class="select-filter">
            <option value="ALL" ${this.modeFilter === 'ALL' ? 'selected' : ''}>All Modes</option>
            <option value="On-site" ${this.modeFilter === 'On-site' ? 'selected' : ''}>On-site</option>
            <option value="Hybrid" ${this.modeFilter === 'Hybrid' ? 'selected' : ''}>Hybrid</option>
            <option value="Remote" ${this.modeFilter === 'Remote' ? 'selected' : ''}>Remote</option>
          </select>
        </div>

        <div class="table-toolbar-right">
          <button id="btn-export-csv" class="btn btn-secondary btn-sm" title="Export CSV / Excel">
            ${icons.download}
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="table-card-wrapper">
        <table class="linear-table">
          <thead>
            <tr>
              <th data-field="company" class="th-sortable">Company ${this.getSortIndicator('company')}</th>
              <th data-field="role" class="th-sortable">Role ${this.getSortIndicator('role')}</th>
              <th data-field="status" class="th-sortable">Status ${this.getSortIndicator('status')}</th>
              <th data-field="packageNumeric" class="th-sortable">Package ${this.getSortIndicator('packageNumeric')}</th>
              <th data-field="workMode">Mode</th>
              <th data-field="appliedDate" class="th-sortable">Applied ${this.getSortIndicator('appliedDate')}</th>
              <th data-field="daysActive" class="th-sortable">Active</th>
              <th data-field="nextMilestoneDate" class="th-sortable">Next Milestone ${this.getSortIndicator('nextMilestoneDate')}</th>
              <th data-field="channel">Channel</th>
              <th>Link</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${jobs.length === 0 ? `
              <tr>
                <td colspan="11" class="td-empty">
                  No applications match your criteria.
                </td>
              </tr>
            ` : jobs.map(job => this.renderTableRow(job)).join('')}
          </tbody>
        </table>
      </div>
      <div class="table-meta-bar">
        <span>Showing ${jobs.length} of ${storage.getJobs().length} total applications</span>
      </div>
    `;

    this.attachEventListeners();
  }

  renderTableRow(job) {
    let daysActive = '-';
    if (job.appliedDate) {
      const d = Math.floor((new Date() - new Date(job.appliedDate)) / (1000 * 60 * 60 * 24));
      daysActive = `${d}d`;
    }

    let milestoneHtml = '<span class="text-muted">-</span>';
    if (job.nextMilestoneDate) {
      const mDate = new Date(job.nextMilestoneDate);
      const isPast = mDate < new Date();
      const formatted = mDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      milestoneHtml = `
        <div class="cell-milestone ${isPast ? 'overdue' : 'upcoming'}">
          <span class="m-type">${this.escape(job.milestoneType || 'Milestone')}:</span>
          <span class="m-date">${formatted}</span>
        </div>
      `;
    }

    const stageObj = STAGES.find(s => s.id === job.status) || STAGES[1];

    return `
      <tr class="table-row" data-job-id="${job.id}">
        <td class="td-company">
          <div class="company-cell">
            <span class="status-dot" style="background: ${stageObj.color};"></span>
            <span class="company-title">${this.escape(job.company)}</span>
          </div>
        </td>
        <td class="td-role">${this.escape(job.role || 'Unspecified')}</td>
        <td class="td-status">
          <select class="status-select-inline" data-job-id="${job.id}">
            ${STAGES.map(s => `<option value="${s.id}" ${s.id === job.status ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>
        </td>
        <td class="td-package font-mono">
          <span class="package-chip">${this.escape(job.packageLpa || 'NA')}</span>
        </td>
        <td class="td-mode"><span class="chip-mode">${this.escape(job.workMode || 'On-site')}</span></td>
        <td class="td-applied font-mono">${job.appliedDate || '-'}</td>
        <td class="td-days font-mono">${daysActive}</td>
        <td class="td-milestone">${milestoneHtml}</td>
        <td class="td-channel">${this.escape(job.channel || '-')}</td>
        <td class="td-link">
          ${job.jobLink ? `
            <a href="${this.escape(job.jobLink)}" target="_blank" rel="noopener noreferrer" class="link-btn" title="Open Portal">
              ${icons.link}
            </a>
          ` : '<span class="text-muted">-</span>'}
        </td>
        <td class="td-actions" style="text-align: right;">
          <div class="row-actions">
            <button class="btn-row-action btn-edit-row" data-job-id="${job.id}" title="Edit">
              ${icons.pencil}
            </button>
            ${job.nextMilestoneDate ? `
              <button class="btn-row-action btn-cal-row" data-job-id="${job.id}" title="Download .ics Calendar">
                ${icons.calendar}
              </button>
            ` : ''}
            <button class="btn-row-action btn-del-row" data-job-id="${job.id}" title="Delete">
              ${icons.trash}
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  attachEventListeners() {
    this.container.querySelector('#table-search')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.render();
    });

    this.container.querySelector('#table-filter-status')?.addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.render();
    });

    this.container.querySelector('#table-filter-mode')?.addEventListener('change', (e) => {
      this.modeFilter = e.target.value;
      this.render();
    });

    this.container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
      storage.exportCSV();
      notifications.showToast('CSV export downloaded', 'success');
    });

    this.container.querySelectorAll('.th-sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.field;
        if (this.sortField === field) {
          this.sortAsc = !this.sortAsc;
        } else {
          this.sortField = field;
          this.sortAsc = true;
        }
        this.render();
      });
    });

    this.container.querySelectorAll('.status-select-inline').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const jobId = sel.dataset.jobId;
        storage.updateJobStatus(jobId, sel.value);
        notifications.showToast(`Status updated to ${sel.value}`, 'success');
        this.render();
      });
    });

    this.container.querySelectorAll('.btn-edit-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const job = storage.getJob(btn.dataset.jobId);
        if (job) this.onEditJob(job);
      });
    });

    this.container.querySelectorAll('.btn-cal-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const job = storage.getJob(btn.dataset.jobId);
        if (job) notifications.downloadIcsFile(job);
      });
    });

    this.container.querySelectorAll('.btn-del-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const job = storage.getJob(btn.dataset.jobId);
        if (job && confirm(`Delete application for ${job.company}?`)) {
          storage.deleteJob(job.id);
          notifications.showToast(`Deleted ${job.company}`, 'info');
          this.render();
        }
      });
    });

    this.container.querySelectorAll('.table-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (!e.target.closest('button') && !e.target.closest('select') && !e.target.closest('a')) {
          const job = storage.getJob(row.dataset.jobId);
          if (job) this.onOpenDetail(job);
        }
      });
    });
  }

  getSortIndicator(field) {
    if (this.sortField !== field) return '';
    return this.sortAsc ? '▲' : '▼';
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
}
