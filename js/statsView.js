/**
 * Career Analytics & Metrics Dashboard
 * Elevated replacement of the Excel summary cards with interactive charts and KPI metrics.
 */
import { storage } from './storage.js';

export class StatsView {
  constructor(container) {
    this.container = container;
  }

  render() {
    const jobs = storage.getJobs();
    const stats = storage.getStats();

    // Work mode breakdown
    const modes = { 'On-site': 0, 'Hybrid': 0, 'Remote': 0 };
    jobs.forEach(j => {
      const mode = j.workMode || 'On-site';
      modes[mode] = (modes[mode] || 0) + 1;
    });

    // Channel breakdown
    const channels = {};
    jobs.forEach(j => {
      const ch = j.channel || 'Direct / Other';
      channels[ch] = (channels[ch] || 0) + 1;
    });

    // Funnel stats
    const applied = jobs.length;
    const shortlisted = jobs.filter(j => ['Shortlisted', 'Exam', 'Interview', 'Offer', 'Placed'].includes(j.status)).length;
    const evaluated = jobs.filter(j => ['Exam', 'Interview', 'Offer', 'Placed'].includes(j.status)).length;
    const offers = jobs.filter(j => ['Offer', 'Placed'].includes(j.status)).length;

    const shortlistPct = applied > 0 ? Math.round((shortlisted / applied) * 100) : 0;
    const interviewPct = applied > 0 ? Math.round((evaluated / applied) * 100) : 0;
    const offerPct = applied > 0 ? Math.round((offers / applied) * 100) : 0;

    this.container.innerHTML = `
      <div class="stats-header">
        <div>
          <h2>Career Analytics & Metrics</h2>
          <span class="stats-subtitle">Real-time pipeline performance & salary analytics</span>
        </div>
      </div>

      <!-- KPI Summary Cards (Elevated from Excel header) -->
      <div class="kpi-grid">
        <div class="kpi-card card-glow-blue">
          <div class="kpi-label">TOTAL APPLIED</div>
          <div class="kpi-value">${stats.total}</div>
          <div class="kpi-desc">All applications logged</div>
        </div>

        <div class="kpi-card card-glow-indigo">
          <div class="kpi-label">SHORTLISTED</div>
          <div class="kpi-value">${stats.shortlisted}</div>
          <div class="kpi-desc">Screening passed (${shortlistPct}%)</div>
        </div>

        <div class="kpi-card card-glow-purple">
          <div class="kpi-label">EXAMS & INTERVIEWS</div>
          <div class="kpi-value">${stats.interviewCount}</div>
          <div class="kpi-desc">Active evaluations (${interviewPct}%)</div>
        </div>

        <div class="kpi-card card-glow-emerald">
          <div class="kpi-label">PLACED (OFFERS)</div>
          <div class="kpi-value">${stats.offers}</div>
          <div class="kpi-desc">Offers secured</div>
        </div>

        <div class="kpi-card card-glow-amber">
          <div class="kpi-label">TOP OFFERED LPA</div>
          <div class="kpi-value">${stats.maxLpa}</div>
          <div class="kpi-desc">Peak compensation</div>
        </div>

        <div class="kpi-card card-glow-cyan">
          <div class="kpi-label">ACTIVE PIPELINE</div>
          <div class="kpi-value">${stats.activePipeline}</div>
          <div class="kpi-desc">In-flight opportunities</div>
        </div>
      </div>

      <!-- Charts & Visual Insights -->
      <div class="analytics-charts-grid">
        <!-- Pipeline Funnel -->
        <div class="analytics-card">
          <div class="card-title">Recruitment Pipeline Funnel</div>
          <div class="funnel-container">
            <div class="funnel-step">
              <div class="funnel-bar" style="width: 100%; background: #38bdf8;">
                <span>Total Applications: ${applied}</span>
                <span>100%</span>
              </div>
            </div>
            <div class="funnel-step">
              <div class="funnel-bar" style="width: ${Math.max(shortlistPct, 12)}%; background: #818cf8;">
                <span>Shortlisted / Passed Resume: ${shortlisted}</span>
                <span>${shortlistPct}%</span>
              </div>
            </div>
            <div class="funnel-step">
              <div class="funnel-bar" style="width: ${Math.max(interviewPct, 12)}%; background: #a855f7;">
                <span>OA & Interviews: ${evaluated}</span>
                <span>${interviewPct}%</span>
              </div>
            </div>
            <div class="funnel-step">
              <div class="funnel-bar" style="width: ${Math.max(offerPct, 10)}%; background: #10b981;">
                <span>Offers / Placed: ${offers}</span>
                <span>${offerPct}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Work Mode Breakdown -->
        <div class="analytics-card">
          <div class="card-title">Work Mode Distribution</div>
          <div class="distribution-bars">
            ${Object.entries(modes).map(([mode, count]) => {
              const pct = applied > 0 ? Math.round((count / applied) * 100) : 0;
              return `
                <div class="dist-row">
                  <div class="dist-header">
                    <span>${mode}</span>
                    <span>${count} (${pct}%)</span>
                  </div>
                  <div class="dist-track">
                    <div class="dist-fill fill-${mode.toLowerCase().replace('-', '')}" style="width: ${pct}%;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Channel / Mode Source -->
        <div class="analytics-card">
          <div class="card-title">Application Channels</div>
          <div class="distribution-bars">
            ${Object.entries(channels).map(([ch, count]) => {
              const pct = applied > 0 ? Math.round((count / applied) * 100) : 0;
              return `
                <div class="dist-row">
                  <div class="dist-header">
                    <span>${this.escape(ch)}</span>
                    <span>${count} (${pct}%)</span>
                  </div>
                  <div class="dist-track">
                    <div class="dist-fill fill-cyan" style="width: ${pct}%;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Package Compensation List -->
        <div class="analytics-card">
          <div class="card-title">Compensation Overview (LPA)</div>
          <div class="salary-list">
            ${jobs.map(j => `
              <div class="salary-item">
                <span class="salary-company">${this.escape(j.company)}</span>
                <span class="salary-tag">${this.escape(j.packageLpa || 'Not Disclosed')}</span>
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
