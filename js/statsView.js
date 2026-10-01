/**
 * Career Analytics & Compensation Insights - Linear Style
 */
import { storage } from './storage.js';

export class StatsView {
  constructor(container) {
    this.container = container;
  }

  render() {
    const jobs = storage.getJobs();
    const stats = storage.getStats();

    const modes = { 'On-site': 0, 'Hybrid': 0, 'Remote': 0 };
    jobs.forEach(j => {
      const mode = j.workMode || 'On-site';
      modes[mode] = (modes[mode] || 0) + 1;
    });

    const channels = {};
    jobs.forEach(j => {
      const ch = j.channel || 'Direct / Other';
      channels[ch] = (channels[ch] || 0) + 1;
    });

    const applied = jobs.length;
    const shortlisted = jobs.filter(j => ['Shortlisted', 'Exam', 'Interview', 'Offer', 'Placed'].includes(j.status)).length;
    const evaluated = jobs.filter(j => ['Exam', 'Interview', 'Offer', 'Placed'].includes(j.status)).length;
    const offers = jobs.filter(j => ['Offer', 'Placed'].includes(j.status)).length;

    const shortlistPct = applied > 0 ? Math.round((shortlisted / applied) * 100) : 0;
    const interviewPct = applied > 0 ? Math.round((evaluated / applied) * 100) : 0;
    const offerPct = applied > 0 ? Math.round((offers / applied) * 100) : 0;

    this.container.innerHTML = `
      <div class="stats-header-bar">
        <div>
          <h2 style="font-size: 1.15rem; font-weight: 700;">Career Analytics & Placement Funnel</h2>
          <span style="font-size: 0.78rem; color: var(--text-secondary);">Conversion rates, compensation breakdown, and work mode ratios</span>
        </div>
      </div>

      <!-- KPI Ribbon -->
      <div class="metric-ribbon">
        <div class="metric-card">
          <span class="metric-card-label">Total Applied</span>
          <span class="metric-card-val">${stats.total}</span>
          <span class="metric-card-sub">All submissions</span>
        </div>
        <div class="metric-card">
          <span class="metric-card-label">Shortlisted</span>
          <span class="metric-card-val" style="color: #6366f1;">${stats.shortlisted}</span>
          <span class="metric-card-sub">${shortlistPct}% pass rate</span>
        </div>
        <div class="metric-card">
          <span class="metric-card-label">Interviews / OA</span>
          <span class="metric-card-val" style="color: #f59e0b;">${stats.interviewCount}</span>
          <span class="metric-card-sub">${interviewPct}% evaluation</span>
        </div>
        <div class="metric-card">
          <span class="metric-card-label">Placed (Offers)</span>
          <span class="metric-card-val" style="color: #10b981;">${stats.offers}</span>
          <span class="metric-card-sub">Secured offers</span>
        </div>
        <div class="metric-card">
          <span class="metric-card-label">Peak LPA</span>
          <span class="metric-card-val" style="color: #0ea5e9;">${stats.maxLpa}</span>
          <span class="metric-card-sub">Top compensation</span>
        </div>
        <div class="metric-card">
          <span class="metric-card-label">Active Pipeline</span>
          <span class="metric-card-val">${stats.activePipeline}</span>
          <span class="metric-card-sub">Pending outcomes</span>
        </div>
      </div>

      <!-- Analytics Grid -->
      <div class="analytics-panels-grid">
        <!-- Pipeline Funnel -->
        <div class="analytics-panel">
          <div class="panel-header">Conversion Funnel</div>
          <div class="linear-funnel">
            <div class="funnel-row">
              <div class="funnel-label"><span>Applied</span><span class="font-mono">${applied} (100%)</span></div>
              <div class="funnel-track"><div class="funnel-bar" style="width: 100%; background: #0ea5e9;"></div></div>
            </div>
            <div class="funnel-row">
              <div class="funnel-label"><span>Shortlisted</span><span class="font-mono">${shortlisted} (${shortlistPct}%)</span></div>
              <div class="funnel-track"><div class="funnel-bar" style="width: ${Math.max(shortlistPct, 8)}%; background: #6366f1;"></div></div>
            </div>
            <div class="funnel-row">
              <div class="funnel-label"><span>OA & Interviews</span><span class="font-mono">${evaluated} (${interviewPct}%)</span></div>
              <div class="funnel-track"><div class="funnel-bar" style="width: ${Math.max(interviewPct, 8)}%; background: #f59e0b;"></div></div>
            </div>
            <div class="funnel-row">
              <div class="funnel-label"><span>Offers</span><span class="font-mono">${offers} (${offerPct}%)</span></div>
              <div class="funnel-track"><div class="funnel-bar" style="width: ${Math.max(offerPct, 8)}%; background: #10b981;"></div></div>
            </div>
          </div>
        </div>

        <!-- Work Mode Ratio -->
        <div class="analytics-panel">
          <div class="panel-header">Work Mode Distribution</div>
          <div class="ratio-bars-list">
            ${Object.entries(modes).map(([mode, count]) => {
              const pct = applied > 0 ? Math.round((count / applied) * 100) : 0;
              return `
                <div class="ratio-item">
                  <div class="ratio-label"><span>${mode}</span><span class="font-mono">${count} (${pct}%)</span></div>
                  <div class="ratio-track"><div class="ratio-fill" style="width: ${pct}%;"></div></div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Application Channels -->
        <div class="analytics-panel">
          <div class="panel-header">Channel & Mode Origin</div>
          <div class="ratio-bars-list">
            ${Object.entries(channels).map(([ch, count]) => {
              const pct = applied > 0 ? Math.round((count / applied) * 100) : 0;
              return `
                <div class="ratio-item">
                  <div class="ratio-label"><span>${this.escape(ch)}</span><span class="font-mono">${count} (${pct}%)</span></div>
                  <div class="ratio-track"><div class="ratio-fill" style="width: ${pct}%; background: #6366f1;"></div></div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Compensation Table -->
        <div class="analytics-panel">
          <div class="panel-header">Compensation Breakdown</div>
          <div class="comp-list">
            ${jobs.map(j => `
              <div class="comp-row">
                <span class="comp-company">${this.escape(j.company)}</span>
                <span class="package-chip">${this.escape(j.packageLpa || 'Not Disclosed')}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
}
