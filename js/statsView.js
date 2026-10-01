/**
 * Career Analytics & Intelligence Dashboard - Linear / Stripe Style
 * High-density metrics, conversion funnels, CTC tiers, and milestone alerts
 */
import { storage } from './storage.js';
import { notifications } from './notifications.js';
import { icons } from './icons.js';

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

    // Pipeline Velocity (average days active)
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

    this.container.innerHTML = `
      <div class="analytics-container">
        <!-- Header -->
        <div class="analytics-header">
          <div>
            <h2 style="font-size: 1.15rem; font-weight: 700;">Career Analytics & Placement Intelligence</h2>
            <span style="font-size: 0.78rem; color: var(--text-secondary);">Conversion rates, compensation tiers, and active milestone health</span>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="analytics-metrics-grid">
          <div class="stat-metric-card">
            <div class="stat-metric-header">
              <span class="stat-metric-label">Total Applied</span>
              <span class="stat-badge-trend stat-badge-blue">100%</span>
            </div>
            <div class="stat-metric-value">${stats.total}</div>
            <span class="stat-metric-desc">Submissions logged</span>
          </div>

          <div class="stat-metric-card">
            <div class="stat-metric-header">
              <span class="stat-metric-label">Shortlisted</span>
              <span class="stat-badge-trend stat-badge-purple">${shortlistRate}% pass</span>
            </div>
            <div class="stat-metric-value" style="color: #818cf8;">${stats.shortlisted}</div>
            <span class="stat-metric-desc">Passed resume screening</span>
          </div>

          <div class="stat-metric-card">
            <div class="stat-metric-header">
              <span class="stat-metric-label">Interviews / OA</span>
              <span class="stat-badge-trend stat-badge-amber">${interviewRate}% conv</span>
            </div>
            <div class="stat-metric-value" style="color: #fbbf24;">${stats.interviewCount}</div>
            <span class="stat-metric-desc">Active technical tests</span>
          </div>

          <div class="stat-metric-card">
            <div class="stat-metric-header">
              <span class="stat-metric-label">Offers Placed</span>
              <span class="stat-badge-trend stat-badge-green">${offerRate}% win</span>
            </div>
            <div class="stat-metric-value" style="color: #10b981;">${stats.offers}</div>
            <span class="stat-metric-desc">Secured job offers</span>
          </div>

          <div class="stat-metric-card">
            <div class="stat-metric-header">
              <span class="stat-metric-label">Peak Package</span>
              <span class="stat-badge-trend stat-badge-blue">Max LPA</span>
            </div>
            <div class="stat-metric-value" style="color: #0ea5e9;">${stats.maxLpa}</div>
            <span class="stat-metric-desc">Top compensation in funnel</span>
          </div>

          <div class="stat-metric-card">
            <div class="stat-metric-header">
              <span class="stat-metric-label">Avg Pipeline Age</span>
              <span class="stat-badge-trend stat-badge-purple">${avgVelocity}d avg</span>
            </div>
            <div class="stat-metric-value">${avgVelocity} Days</div>
            <span class="stat-metric-desc">Average days since applied</span>
          </div>
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
                  <div class="funnel-fill" style="width: 100%; background: #0ea5e9;"></div>
                </div>
              </div>

              <div class="funnel-step-row">
                <div class="funnel-step-header">
                  <span>Shortlisted (Passed Resume)</span>
                  <span class="font-mono"><strong>${shortlisted}</strong> (${shortlistRate}%)</span>
                </div>
                <div class="funnel-track">
                  <div class="funnel-fill" style="width: ${Math.max(shortlistRate, 8)}%; background: #6366f1;"></div>
                </div>
              </div>

              <div class="funnel-step-row">
                <div class="funnel-step-header">
                  <span>Coding OA & Interviews</span>
                  <span class="font-mono"><strong>${interviewing}</strong> (${interviewRate}%)</span>
                </div>
                <div class="funnel-track">
                  <div class="funnel-fill" style="width: ${Math.max(interviewRate, 8)}%; background: #f59e0b;"></div>
                </div>
              </div>

              <div class="funnel-step-row">
                <div class="funnel-step-header">
                  <span>Offers Secured</span>
                  <span class="font-mono"><strong>${offers}</strong> (${offerRate}%)</span>
                </div>
                <div class="funnel-track">
                  <div class="funnel-fill" style="width: ${Math.max(offerRate, 8)}%; background: #10b981;"></div>
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
                  <div class="tier-fill" style="width: ${total > 0 ? (tiers.twelveTo18 / total) * 100 : 0}%; background: #10b981;"></div>
                </div>
              </div>

              <div class="tier-row">
                <div class="tier-header">
                  <span>Mid Tier (6 - 12 LPA)</span>
                  <span class="font-mono"><strong>${tiers.sixTo12}</strong> applications</span>
                </div>
                <div class="tier-track">
                  <div class="tier-fill" style="width: ${total > 0 ? (tiers.sixTo12 / total) * 100 : 0}%; background: #6366f1;"></div>
                </div>
              </div>

              <div class="tier-row">
                <div class="tier-header">
                  <span>Entry Tier (< 6 LPA)</span>
                  <span class="font-mono"><strong>${tiers.under6}</strong> applications</span>
                </div>
                <div class="tier-track">
                  <div class="tier-fill" style="width: ${total > 0 ? (tiers.under6 / total) * 100 : 0}%; background: #0ea5e9;"></div>
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
                      <div class="tier-fill" style="width: ${pct}%; background: #0ea5e9;"></div>
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
                      <div class="tier-fill" style="width: ${pct}%; background: #818cf8;"></div>
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
              <div class="text-muted" style="font-size: 0.8rem; padding: 12px 0;">No milestones scheduled right now.</div>
            ` : upcomingEvents.map(job => {
              const mDate = new Date(job.nextMilestoneDate);
              const gCal = notifications.getGoogleCalendarUrl(job);
              const daysAway = Math.ceil((mDate - new Date()) / (1000 * 60 * 60 * 24));
              const countdownText = daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`;

              return `
                <div class="action-milestone-item">
                  <div class="ami-left">
                    <div class="ami-title">
                      <strong>${this.escape(job.company)}</strong> — <span>${this.escape(job.milestoneType || 'Milestone')}</span>
                      <span class="chip chip-mode">${this.escape(job.role || 'Role')}</span>
                    </div>
                    <div class="ami-date">
                      ${countdownText} • ${mDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style="display: flex; gap: 6px; align-items: center;">
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

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
}
