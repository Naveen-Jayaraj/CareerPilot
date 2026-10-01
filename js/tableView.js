/**
 * Dense Table View - Modern Spreadsheet replacement
 * Highly customizable, fast filtering, sorting, and direct actions.
 */
import { storage } from './storage.js';
import { notifications } from './notifications.js';
import { STAGES } from './kanbanView.js';

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
        // inverse because earlier date = more days active
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
      <div class="table-view-header">
        <div class="table-controls-left">
          <div class="search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="table-search" placeholder="Filter company, role, channel..." value="${this.escape(this.searchQuery)}" />
          </div>

          <select id="table-filter-status" class="select-filter">
            <option value="ALL" ${this.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
            ${STAGES.map(s => `<option value="${s.id}" ${this.statusFilter === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>

          <select id="table-filter-mode" class="select-filter">
            <option value="ALL" ${this.modeFilter === 'ALL' ? 'selected' : ''}>All Work Modes</option>
            <option value="On-site" ${this.modeFilter === 'On-site' ? 'selected' : ''}>On-site</option>
            <option value="Hybrid" ${this.modeFilter === 'Hybrid' ? 'selected' : ''}>Hybrid</option>
            <option value="Remote" ${this.modeFilter === 'Remote' ? 'selected' : ''}>Remote</option>
          </select>
        </div>

        <div class="table-controls-right">
          <button id="btn-export-csv" class="btn btn-secondary btn-sm" title="Export as CSV (Excel compatible)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Excel
          </button>
          <button id="table-add-btn" class="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Job
          </button>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="dense-table" id="dense-tracker-table">
          <thead>
            <tr>
              <th data-field="company" class="th-sortable">Company ${this.getSortIcon('company')}</th>
              <th data-field="role" class="th-sortable">Role / Designation ${this.getSortIcon('role')}</th>
              <th data-field="status" class="th-sortable">Status ${this.getSortIcon('status')}</th>
              <th data-field="packageNumeric" class="th-sortable">Package (LPA) ${this.getSortIcon('packageNumeric')}</th>
              <th data-field="workMode">Work Mode</th>
              <th data-field="appliedDate" class="th-sortable">Applied Date ${this.getSortIcon('appliedDate')}</th>
              <th data-field="daysActive" class="th-sortable">Days Active</th>
              <th data-field="nextMilestoneDate" class="th-sortable">Next Milestone ${this.getSortIcon('nextMilestoneDate')}</th>
              <th data-field="channel">Channel / Category</th>
              <th>Quick Link</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${jobs.length === 0 ? `
              <tr>
                <td colspan="11" class="td-empty">
                  No matching applications found. <a href="#" id="link-clear-filters">Clear filters</a> or add a new job.
                </td>
              </tr>
            ` : jobs.map(job => this.renderTableRow(job)).join('')}
          </tbody>
        </table>
      </div>
      <div class="table-footer-summary">
        Showing ${jobs.length} of ${storage.getJobs().length} total applications
      </div>
    `;

    this.attachEventListeners();
  }

  renderTableRow(job) {
    // Days active
    let daysActive = '-';
    if (job.appliedDate) {
      daysActive = Math.floor((new Date() - new Date(job.appliedDate)) / (1000 * 60 * 60 * 24));
      daysActive = `${daysActive}d`;
    }

    // Milestone string
    let milestoneHtml = '<span class="text-muted">None</span>';
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

    // Status badge style
    const stageObj = STAGES.find(s => s.id === job.status) || STAGES[1];

    return `
      <tr class="table-row" data-job-id="${job.id}">
        <td class="td-company">
          <div class="company-name-cell">
            <span class="company-indicator" style="background: ${stageObj.color};"></span>
            <strong>${this.escape(job.company)}</strong>
          </div>
        </td>
        <td class="td-role">${this.escape(job.role || 'Unspecified')}</td>
        <td class="td-status">
          <select class="inline-status-select" data-job-id="${job.id}" style="color: ${stageObj.color}; border-color: ${stageObj.color}33;">
            ${STAGES.map(s => `<option value="${s.id}" ${s.id === job.status ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>
        </td>
        <td class="td-package font-mono">
          <span class="package-pill">${this.escape(job.packageLpa || 'NA')}</span>
        </td>
        <td class="td-mode"><span class="badge-mode badge-${(job.workMode || 'onsite').toLowerCase().replace('-', '')}">${this.escape(job.workMode || 'On-site')}</span></td>
        <td class="td-applied font-mono">${job.appliedDate || '-'}</td>
        <td class="td-days font-mono">${daysActive}</td>
        <td class="td-milestone">${milestoneHtml}</td>
        <td class="td-channel"><span class="tag-channel">${this.escape(job.channel || '-')}</span></td>
        <td class="td-link">
          ${job.jobLink ? `
            <a href="${this.escape(job.jobLink)}" target="_blank" rel="noopener noreferrer" class="link-badge" title="Open Job Portal">
              Portal ↗
            </a>
          ` : '<span class="text-muted">-</span>'}
        </td>
        <td class="td-actions">
          <div class="table-action-btns">
            <button class="btn-action-icon btn-edit-row" data-job-id="${job.id}" title="Edit Job">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            ${job.nextMilestoneDate ? `
              <button class="btn-action-icon btn-ics-row" data-job-id="${job.id}" title="Download Calendar .ics Event">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </button>
            ` : ''}
            <button class="btn-action-icon btn-del-row" data-job-id="${job.id}" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  attachEventListeners() {
    // Search
    const searchInput = this.container.querySelector('#table-search');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.render();
    });

    // Filters
    this.container.querySelector('#table-filter-status')?.addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.render();
    });

    this.container.querySelector('#table-filter-mode')?.addEventListener('change', (e) => {
      this.modeFilter = e.target.value;
      this.render();
    });

    // Clear filters link
    this.container.querySelector('#link-clear-filters')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.searchQuery = '';
      this.statusFilter = 'ALL';
      this.modeFilter = 'ALL';
      this.render();
    });

    // Export CSV
    this.container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
      storage.exportCSV();
      notifications.showToast('Exported applications to CSV / Excel format', 'success');
    });

    // Add Job
    this.container.querySelector('#table-add-btn')?.addEventListener('click', () => {
      this.onEditJob(null);
    });

    // Column sorting
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

    // Inline status change
    this.container.querySelectorAll('.inline-status-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const jobId = sel.dataset.jobId;
        const newStatus = sel.value;
        storage.updateJobStatus(jobId, newStatus);
        notifications.showToast(`Updated status to ${newStatus}`, 'success');
        this.render();
      });
    });

    // Row edit / delete / calendar
    this.container.querySelectorAll('.btn-edit-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const job = storage.getJob(btn.dataset.jobId);
        if (job) this.onEditJob(job);
      });
    });

    this.container.querySelectorAll('.btn-ics-row').forEach(btn => {
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

    // Click row to view details
    this.container.querySelectorAll('.table-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (!e.target.closest('button') && !e.target.closest('select') && !e.target.closest('a')) {
          const job = storage.getJob(row.dataset.jobId);
          if (job) this.onOpenDetail(job);
        }
      });
    });
  }

  getSortIcon(field) {
    if (this.sortField !== field) return '<span class="sort-idle">↕</span>';
    return this.sortAsc ? '<span class="sort-active">▲</span>' : '<span class="sort-active">▼</span>';
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
}
