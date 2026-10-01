/**
 * Streamlined & Vibrant Calendar View
 * Clean glowing milestone dots, colorful company avatars, non-cluttered timeline
 */
import { storage } from './storage.js';
import { notifications } from './notifications.js';
import { icons } from './icons.js';
import { getCompanyAvatar } from './avatars.js';

export class CalendarView {
  constructor(container, onEditJob, onOpenDetail) {
    this.container = container;
    this.onEditJob = onEditJob;
    this.onOpenDetail = onOpenDetail;
    this.currentDate = new Date();
    this.viewMode = window.innerWidth <= 640 ? 'agenda' : 'grid';
  }

  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const jobs = storage.getJobs();
    const events = [];
    jobs.forEach(job => {
      if (job.nextMilestoneDate) {
        const d = new Date(job.nextMilestoneDate);
        if (!isNaN(d.getTime())) {
          events.push({
            date: d,
            dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
            job,
            title: `${job.company}: ${job.milestoneType || 'Milestone'}`
          });
        }
      }
    });

    this.container.innerHTML = `
      <div class="calendar-container">
        <!-- Minimalist Header Bar -->
        <div class="calendar-header-bar">
          <div class="cal-header-left">
            <h2 class="cal-month-title">${monthNames[month]} ${year}</h2>
          </div>

          <div class="cal-header-right">
            <!-- View Toggle -->
            <div class="cal-view-toggle">
              <button class="cal-toggle-btn ${this.viewMode === 'grid' ? 'active' : ''}" id="btn-mode-grid">
                Month
              </button>
              <button class="cal-toggle-btn ${this.viewMode === 'agenda' ? 'active' : ''}" id="btn-mode-agenda">
                Agenda
              </button>
            </div>

            <!-- Month Nav -->
            <div class="cal-nav-btns">
              <button id="cal-prev" class="btn btn-secondary btn-xs" title="Previous month">‹</button>
              <button id="cal-today" class="btn btn-secondary btn-xs">Today</button>
              <button id="cal-next" class="btn btn-secondary btn-xs" title="Next month">›</button>
            </div>
          </div>
        </div>

        <!-- Main Body -->
        <div class="cal-card">
          ${this.viewMode === 'grid' ? this.renderGridHTML(year, month, events) : this.renderAgendaHTML(events)}
        </div>

        <!-- Upcoming Schedule Summary -->
        ${this.viewMode === 'grid' ? `
          <div class="cal-agenda-wrap" style="margin-top: 14px;">
            <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;">
              Upcoming Schedule
            </div>
            ${this.renderUpcomingItems(events)}
          </div>
        ` : ''}
      </div>
    `;

    this.attachEventListeners(year, month, events);
  }

  renderGridHTML(year, month, events) {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    let cellsHtml = '';

    // Previous month outside days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cellsHtml += `
        <div class="cal-day-cell cal-day-outside">
          <div class="day-num-bar"><span class="day-num">${prevMonthTotalDays - i}</span></div>
        </div>
      `;
    }

    // Month days
    for (let d = 1; d <= totalDays; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateKey === todayKey;
      const dayEvents = events.filter(e => e.dateKey === dateKey);

      let dotsHtml = '';
      if (dayEvents.length > 0) {
        dotsHtml = `
          <div class="day-dots-wrap">
            ${dayEvents.slice(0, 3).map(ev => {
              const type = (ev.job.milestoneType || '').toLowerCase();
              let dotClass = 'dot-general';
              if (type.includes('interview')) dotClass = 'dot-interview';
              else if (type.includes('exam') || type.includes('assessment')) dotClass = 'dot-exam';
              else if (type.includes('deadline') || type.includes('offer')) dotClass = 'dot-deadline';
              return `<span class="cal-dot ${dotClass}" title="${this.escape(ev.title)}"></span>`;
            }).join('')}
            ${dayEvents.length > 3 ? `<span style="font-size: 0.6rem; color: var(--text-muted); font-weight: 700;">+${dayEvents.length - 3}</span>` : ''}
          </div>
        `;
      }

      cellsHtml += `
        <div class="cal-day-cell ${isToday ? 'cal-day-today' : ''}" data-date-key="${dateKey}">
          <div class="day-num-bar">
            <span class="day-num">${d}</span>
          </div>
          ${dotsHtml}
        </div>
      `;
    }

    return `
      <div class="cal-weekdays-grid">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>
      <div class="cal-days-matrix" id="calendar-days-grid">
        ${cellsHtml}
      </div>
    `;
  }

  renderAgendaHTML(events) {
    const sorted = events.sort((a, b) => a.date - b.date);

    if (sorted.length === 0) {
      return `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.8rem;">No scheduled events. Set milestone dates on your applications to track them here.</div>`;
    }

    return `
      <div class="cal-agenda-wrap">
        ${this.renderUpcomingItems(events)}
      </div>
    `;
  }

  renderUpcomingItems(events) {
    const upcoming = events
      .filter(e => e.date >= new Date(Date.now() - 24 * 60 * 60 * 1000))
      .sort((a, b) => a.date - b.date);

    if (upcoming.length === 0) {
      return `<div style="padding: 12px; color: var(--text-muted); font-size: 0.78rem;">No upcoming milestones right now.</div>`;
    }

    const now = new Date();

    return upcoming.slice(0, 8).map(ev => {
      const diffDays = Math.ceil((ev.date - now) / (1000 * 60 * 60 * 24));
      let countdownLabel = diffDays <= 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays}d`;
      let countdownClass = diffDays <= 1 ? 'countdown-urgent' : diffDays <= 3 ? 'countdown-soon' : 'countdown-normal';

      const gCalUrl = notifications.getGoogleCalendarUrl(ev.job);
      const monthShort = ev.date.toLocaleDateString(undefined, { month: 'short' });
      const dayNum = ev.date.getDate();
      const timeStr = ev.date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

      return `
        <div class="cal-agenda-item" data-job-id="${ev.job.id}">
          <div class="cal-agenda-left">
            <div class="cal-agenda-date-box">
              <div class="cad-month">${monthShort}</div>
              <div class="cad-day">${dayNum}</div>
            </div>
            ${getCompanyAvatar(ev.job.company, 28)}
            <div class="cal-agenda-info">
              <div class="cal-agenda-company">
                <span>${this.escape(ev.job.company)}</span>
                <span class="cal-countdown-pill ${countdownClass}">${countdownLabel}</span>
              </div>
              <div class="cal-agenda-milestone">
                ${this.escape(ev.job.milestoneType || 'Milestone')} &bull; ${timeStr}
              </div>
            </div>
          </div>
          <div class="cal-agenda-right">
            ${gCalUrl ? `<a href="${gCalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs">+ GCal</a>` : ''}
            <button class="btn btn-secondary btn-xs btn-ics-tray" data-job-id="${ev.job.id}" title="Download .ics">.ics</button>
            <button class="btn btn-primary btn-xs btn-view-tray" data-job-id="${ev.job.id}">View</button>
          </div>
        </div>
      `;
    }).join('');
  }

  attachEventListeners(year, month, events) {
    this.container.querySelector('#btn-mode-grid')?.addEventListener('click', () => {
      this.viewMode = 'grid';
      this.render();
    });

    this.container.querySelector('#btn-mode-agenda')?.addEventListener('click', () => {
      this.viewMode = 'agenda';
      this.render();
    });

    this.container.querySelector('#cal-prev')?.addEventListener('click', () => {
      this.currentDate = new Date(year, month - 1, 1);
      this.render();
    });

    this.container.querySelector('#cal-next')?.addEventListener('click', () => {
      this.currentDate = new Date(year, month + 1, 1);
      this.render();
    });

    this.container.querySelector('#cal-today')?.addEventListener('click', () => {
      this.currentDate = new Date();
      this.render();
    });

    // Date cell click in grid: if date has events, open detail of first event
    this.container.querySelectorAll('.cal-day-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const dateKey = cell.dataset.dateKey;
        const matching = events.find(e => e.dateKey === dateKey);
        if (matching) {
          this.onOpenDetail(matching.job);
        }
      });
    });

    this.container.querySelectorAll('.btn-ics-tray').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const job = storage.getJob(btn.dataset.jobId);
        if (job) notifications.downloadIcsFile(job);
      });
    });

    this.container.querySelectorAll('.btn-view-tray').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const job = storage.getJob(btn.dataset.jobId);
        if (job) this.onOpenDetail(job);
      });
    });

    this.container.querySelectorAll('.cal-agenda-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        const job = storage.getJob(item.dataset.jobId);
        if (job) this.onOpenDetail(job);
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
