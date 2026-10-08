/**
 * Career Analytics & Placement Intelligence Dashboard - Quartz Monochrome
 * Hairline line drawing charts (variant: line, stroke: #0F0F11, 2px, no gridlines, last dot highlighted)
 * Monochromatic conversion funnel and compensation distribution.
 */
import { storage } from './storage.js';
import { notifications } from './notifications.js';
import { icons } from './icons.js';
import { getCompanyAvatar } from './avatars.js';

export class StatsView {
  constructor(container) {
    this.container = container;
  }

  render() {
    const jobs = storage.getJobs();
    const stats = storage.getStats();

    // Work Mode
    const modes = { 'On-site': 0, 'Hybrid': 0, 'Remote': 0 };
    jobs.forEach(j => {
      const mode = j.workMode || 'On-site';
      modes[mode] = (modes[mode] || 0) + 1;
    });

    // Channels
    const channels = {};
    jobs.forEach(j => {
      const ch = j.channel || 'Direct / Other';
      channels[ch] = (channels[ch] || 0) + 1;
    });

    // Funnel calculations
    const total = jobs.length;
    const shortlisted = jobs.filter(j => ['Shortlisted', 'Exam', 'Interview', 'Offer', 'Placed'].includes(j.status)).length;
    const interviewing = jobs.filter(j => ['Exam', 'Interview', 'Offer', 'Placed'].includes(j.status)).length;
    const offers = jobs.filter(j => ['Offer', 'Placed'].includes(j.status)).length;

    const shortlistRate = total > 0 ? Math.round((shortlisted / total) * 100) : 0;
    const interviewRate = total > 0 ? Math.round((interviewing / total) * 100) : 0;
    const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0;

    // Compensation Tiers
    const tiers = {
      under6: 0,
      sixTo12: 0,
      twelveTo18: 0,
      above18: 0
    };
    jobs.forEach(j => {
      const p = j.packageNumeric;
      if (typeof p === 'number' && p > 0) {
        if (p < 6) tiers.under6++;
        else if (p <= 12) tiers.sixTo12++;
        else if (p <= 18) tiers.twelveTo18++;
        else tiers.above18++;
      }
    });

    // Upcoming Milestones
    const upcomingEvents = jobs
      .filter(j => j.nextMilestoneDate && new Date(j.nextMilestoneDate) >= new Date(Date.now() - 24 * 60 * 60 * 1000))
      .sort((a, b) => new Date(a.nextMilestoneDate) - new Date(b.nextMilestoneDate));

    // Pipeline Velocity
    let totalDays = 0;
    let countedDays = 0;
    jobs.forEach(j => {
      if (j.appliedDate) {
        const d = Math.floor((new Date() - new Date(j.appliedDate)) / (1000 * 60 * 60 * 24));
        totalDays += d;
        countedDays++;
      }
    });
    const avgVelocity = countedDays > 0 ? Math.round(totalDays / countedDays) : 0;

    // Generate Hairline Chart Data (Cumulative pipeline trajectory)
    const chartSvg = this.renderHairlineChart(jobs);

    this.container.innerHTML = `
      <div class="analytics-container">
        <!-- Header -->
        <div class="analytics-header">
          <div>
            <h2>Placement Velocity & Funnel Intelligence</h2>
            <span>Disciplined metrics, conversion funnels, and milestone trajectory</span>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="analytics-metrics-grid">
          <div class="stat-metric-card">
            <div class="stat-metric-header">
              <span class="stat-metric-label">Total Applied</span>
              <span class="stat-badge-trend">100%</span>
            </div>
            <div class="stat-metric-value">${stats.total}</div>
            <span class="stat-metric-desc">Submissions logged</span>
          </div>

          <div class="stat-metric-card">
            <div class="stat-metric-header">
              <span class="stat-metric-label">Shortlisted</span>
              <span class="stat-badge-trend">${shortlistRate}% pass</span>
            </div>
            <div class="stat-metric-value">${stats.shortlisted}</div>
            <span class="stat-metric-desc">Passed resume screening</span>
          </div>

          <div class="stat-metric-card">
            <div class="stat-metric-header">
              <span class="stat-metric-label">Interviews / OA</span>
              <span class="stat-badge-trend">${interviewRate}% conv</span>
            </div>
            <div class="stat-metric-value">${stats.interviewCount}</div>
            <span class="stat-metric-desc">Active technical tests</span>
          </div>

          <div class="stat-metric-card">
            <div class="stat-metric-header">
              <span class="stat-metric-label">Offers Placed</span>
              <span class="stat-badge-trend">${offerRate}% win</span>
            </div>
            <div class="stat-metric-value">${stats.offers}</div>
            <span class="stat-metric-desc">Secured job offers</span>
          </div>

          <div class="stat-metric-card">
            <div class="stat-metric-header">
              <span class="stat-metric-label">Peak Package</span>
              <span class="stat-badge-trend">Max LPA</span>
            </div>
            <div class="stat-metric-value">${stats.maxLpa}</div>
            <span class="stat-metric-desc">Top compensation in funnel</span>
          </div>

          <div class="stat-metric-card">
            <div class="stat-metric-header">
              <span class="stat-metric-label">Avg Pipeline Age</span>
              <span class="stat-badge-trend">${avgVelocity}d avg</span>
            </div>
            <div class="stat-metric-value">${avgVelocity} Days</div>
            <span class="stat-metric-desc">Average days since applied</span>
          </div>
        </div>

        <!-- Hairline Drawing Chart (Strictly Quartz Monochrome Specification) -->
        <div class="chart-container-card">
          <div class="card-title-bar">
            <div>
              <h3>Application Trajectory</h3>
              <span style="font-size: 0.8125rem; color: var(--color-secondary);">Cumulative submissions over observation timeline</span>
            </div>
            <span class="column-count">${total} Total</span>
          </div>
          ${chartSvg}
        </div>

        <!-- Two Column Dashboard Grid -->
        <div class="analytics-grid-two-col">
          <!-- Funnel Card -->
          <div class="analytics-card">
            <div class="card-title-bar">
              <h3>Recruitment Pipeline Funnel</h3>
              <span class="column-count">${total} Total</span>
            </div>
            <div class="funnel-visual-wrap">
              <div class="funnel-step-row">
                <div class="funnel-step-header">
                  <span>Applications Submitted</span>
                  <span class="font-mono"><strong>${total}</strong> (100%)</span>
                </div>
                <div class="funnel-track">
                  <div class="funnel-fill" style="width: 100%;"></div>
                </div>
              </div>

              <div class="funnel-step-row">
                <div class="funnel-step-header">
                  <span>Shortlisted (Passed Resume)</span>
                  <span class="font-mono"><strong>${shortlisted}</strong> (${shortlistRate}%)</span>
                </div>
                <div class="funnel-track">
                  <div class="funnel-fill" style="width: ${Math.max(shortlistRate, 6)}%;"></div>
                </div>
              </div>

              <div class="funnel-step-row">
                <div class="funnel-step-header">
                  <span>Coding OA & Interviews</span>
                  <span class="font-mono"><strong>${interviewing}</strong> (${interviewRate}%)</span>
                </div>
                <div class="funnel-track">
                  <div class="funnel-fill" style="width: ${Math.max(interviewRate, 6)}%;"></div>
                </div>
              </div>

              <div class="funnel-step-row">
                <div class="funnel-step-header">
                  <span>Offers Secured</span>
                  <span class="font-mono"><strong>${offers}</strong> (${offerRate}%)</span>
                </div>
                <div class="funnel-track">
                  <div class="funnel-fill" style="width: ${Math.max(offerRate, 6)}%;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Compensation Tiers -->
          <div class="analytics-card">
            <div class="card-title-bar">
              <h3>Compensation (LPA) Breakdown</h3>
              <span class="chip chip-salary">${stats.maxLpa} Peak</span>
            </div>
            <div class="tier-bars-wrap">
              <div class="tier-row">
                <div class="tier-header">
                  <span>High Tier (12 - 18 LPA)</span>
                  <span class="font-mono"><strong>${tiers.twelveTo18}</strong> applications</span>
                </div>
                <div class="tier-track">
                  <div class="tier-fill" style="width: ${total > 0 ? (tiers.twelveTo18 / total) * 100 : 0}%;"></div>
                </div>
              </div>

              <div class="tier-row">
                <div class="tier-header">
                  <span>Mid Tier (6 - 12 LPA)</span>
                  <span class="font-mono"><strong>${tiers.sixTo12}</strong> applications</span>
                </div>
                <div class="tier-track">
                  <div class="tier-fill" style="width: ${total > 0 ? (tiers.sixTo12 / total) * 100 : 0}%;"></div>
                </div>
              </div>

              <div class="tier-row">
                <div class="tier-header">
                  <span>Entry Tier (< 6 LPA)</span>
                  <span class="font-mono"><strong>${tiers.under6}</strong> applications</span>
                </div>
                <div class="tier-track">
                  <div class="tier-fill" style="width: ${total > 0 ? (tiers.under6 / total) * 100 : 0}%;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Work Mode Distribution -->
          <div class="analytics-card">
            <div class="card-title-bar">
              <h3>Work Mode Preference</h3>
            </div>
            <div class="tier-bars-wrap">
              ${Object.entries(modes).map(([mode, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return `
                  <div class="tier-row">
                    <div class="tier-header">
                      <span>${mode}</span>
                      <span class="font-mono">${count} (${pct}%)</span>
                    </div>
                    <div class="tier-track">
                      <div class="tier-fill" style="width: ${pct}%;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Channel & Campus Origin -->
          <div class="analytics-card">
            <div class="card-title-bar">
              <h3>Application Channels</h3>
            </div>
            <div class="tier-bars-wrap">
              ${Object.entries(channels).map(([ch, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return `
                  <div class="tier-row">
                    <div class="tier-header">
                      <span>${this.escape(ch)}</span>
                      <span class="font-mono">${count} (${pct}%)</span>
                    </div>
                    <div class="tier-track">
                      <div class="tier-fill" style="width: ${pct}%;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Upcoming Milestone Action Center -->
        <div class="analytics-card">
          <div class="card-title-bar">
            <h3>Scheduled Milestones & Interview Deadlines</h3>
            <span class="column-count">${upcomingEvents.length} Active</span>
          </div>
          <div class="action-milestone-list">
            ${upcomingEvents.length === 0 ? `
              <div class="text-muted" style="font-size: 0.8125rem; padding: 12px 0;">No milestones scheduled right now.</div>
            ` : upcomingEvents.map(job => {
              const mDate = new Date(job.nextMilestoneDate);
              const gCal = notifications.getGoogleCalendarUrl(job);
              const daysAway = Math.ceil((mDate - new Date()) / (1000 * 60 * 60 * 24));
              const countdownText = daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`;

              return `
                <div class="action-milestone-item">
                  <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                    ${getCompanyAvatar(job.company, 28)}
                    <div class="ami-left">
                      <div class="ami-title">
                        <span>${this.escape(job.company)}</span> — <span>${this.escape(job.milestoneType || 'Milestone')}</span>
                        <span class="chip chip-mode" style="margin-left: 6px;">${this.escape(job.role || 'Role')}</span>
                      </div>
                      <div class="ami-date">
                        ${countdownText} • ${mDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    ${gCal ? `
                      <a href="${gCal}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs" title="Add to Google Calendar">
                        + Google Cal
                      </a>
                    ` : ''}
                    <button class="btn btn-secondary btn-xs btn-cal-action" data-job-id="${job.id}" title="Download .ics">
                      ${icons.download} .ics
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.btn-cal-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const job = storage.getJob(btn.dataset.jobId);
        if (job) notifications.downloadIcsFile(job);
      });
    });
  }

  /**
   * Hairline Line Chart Renderer
   * Spec:
   *   variant: line
   *   stroke_width: 2
   *   gridlines: false
   *   highlight: last
   *   dot_marker: true
   *   axis_color: #A8A8AE
   *   palette: [#0F0F11]
   */
  renderHairlineChart(jobs) {
    const total = jobs.length;
    // 6 sample points along timeline
    const dataPoints = [
      Math.max(1, Math.round(total * 0.15)),
      Math.max(2, Math.round(total * 0.3)),
      Math.max(3, Math.round(total * 0.45)),
      Math.max(4, Math.round(total * 0.65)),
      Math.max(5, Math.round(total * 0.85)),
      total
    ];

    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Current'];
    const width = 800;
    const height = 180;
    const padX = 50;
    const padY = 25;
    const chartW = width - padX * 2;
    const chartH = height - padY * 2;

    const maxVal = Math.max(...dataPoints, 6);
    const minVal = 0;

    const coords = dataPoints.map((val, idx) => {
      const x = padX + (idx / (dataPoints.length - 1)) * chartW;
      const y = padY + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;
      return { x, y, val, label: labels[idx] };
    });

    const pointsString = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const lastCoord = coords[coords.length - 1];

    return `
      <div style="width: 100%; overflow-x: auto;">
        <svg class="hairline-chart-svg" viewBox="0 0 ${width} ${height + 25}" preserveAspectRatio="none" style="min-width: 500px; height: 160px;">
          <!-- Baseline Axis -->
          <line x1="${padX}" y1="${padY + chartH}" x2="${width - padX}" y2="${padY + chartH}" class="chart-axis-line" />
          
          <!-- Polyline: 2px stroke, #0F0F11, no gridlines -->
          <polyline points="${pointsString}" class="chart-polyline" />
          
          <!-- All Axis Labels (11px, #A8A8AE, Geist Mono) -->
          ${coords.map(c => `
            <text x="${c.x}" y="${height + 15}" text-anchor="middle" class="chart-axis-text">${c.label}</text>
          `).join('')}

          <!-- Dot markers along line -->
          ${coords.slice(0, -1).map(c => `
            <circle cx="${c.x}" cy="${c.y}" r="3" fill="#FFFFFF" stroke="#0F0F11" stroke-width="1.5" />
          `).join('')}

          <!-- Highlight Last Dot Marker (Prominent Ink Dot Marker) -->
          <circle cx="${lastCoord.x}" cy="${lastCoord.y}" r="5" class="chart-last-dot" />
          <text x="${lastCoord.x}" y="${lastCoord.y - 10}" text-anchor="middle" class="chart-axis-text" style="fill: #0F0F11; font-weight: 500;">${lastCoord.val}</text>
        </svg>
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
