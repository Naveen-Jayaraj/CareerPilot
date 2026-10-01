/**
 * Milestone & Interview Calendar View
 * Monthly interactive view showing all tests, interviews, and deadlines.
 */
import { storage } from './storage.js';
import { notifications } from './notifications.js';

export class CalendarView {
  constructor(container, onEditJob, onOpenDetail) {
    this.container = container;
    this.onEditJob = onEditJob;
    this.onOpenDetail = onOpenDetail;
    this.currentDate = new Date();
  }

  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const jobs = storage.getJobs();
    // Gather all events with dates
    const events = [];
    jobs.forEach(job => {
      if (job.nextMilestoneDate) {
        const d = new Date(job.nextMilestoneDate);
        if (!isNaN(d.getTime())) {
          events.push({
            date: d,
            dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
            job,
            title: `${job.company}: ${job.milestoneType || 'Milestone'}`,
            type: 'milestone'
          });
        }
      }
    });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    this.container.innerHTML = `
      <div class="calendar-view-header">
        <div class="cal-title-group">
          <h2>${monthNames[month]} ${year}</h2>
          <span class="cal-subtitle">Scheduled interviews, assessments & milestone deadlines</span>
        </div>
        <div class="cal-controls">
          <button id="cal-prev" class="btn btn-secondary btn-icon" title="Previous Month">❮</button>
          <button id="cal-today" class="btn btn-secondary btn-sm">Today</button>
          <button id="cal-next" class="btn btn-secondary btn-icon" title="Next Month">❯</button>
        </div>
      </div>

      <div class="calendar-grid-container">
        <div class="calendar-weekdays">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div class="calendar-days-grid" id="calendar-days-grid"></div>
      </div>

      <div class="calendar-upcoming-tray">
        <div class="tray-header">
          <h3>Upcoming Milestones (${events.filter(e => e.date >= new Date()).length})</h3>
        </div>
        <div class="tray-list" id="calendar-tray-list"></div>
      </div>
    `;

    const daysGrid = this.container.querySelector('#calendar-days-grid');
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell cal-day-outside';
      cell.innerHTML = `<span class="day-num">${dayNum}</span>`;
      daysGrid.appendChild(cell);
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell';
      if (dateKey === todayKey) cell.classList.add('cal-day-today');

      const dayEvents = events.filter(e => e.dateKey === dateKey);

      let eventsHtml = '';
      if (dayEvents.length > 0) {
        eventsHtml = `<div class="day-event-dots">
          ${dayEvents.map(ev => `
            <div class="day-event-badge" data-job-id="${ev.job.id}" title="${this.escape(ev.title)}">
              <span class="badge-dot"></span>
              <span class="badge-text">${this.escape(ev.job.company)}</span>
            </div>
          `).join('')}
        </div>`;
      }

      cell.innerHTML = `
        <div class="day-header"><span class="day-num">${d}</span></div>
        ${eventsHtml}
      `;

      cell.querySelectorAll('.day-event-badge').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          const job = storage.getJob(b.dataset.jobId);
          if (job) this.onOpenDetail(job);
        });
      });

      daysGrid.appendChild(cell);
    }

    // Render upcoming list in tray
    const trayList = this.container.querySelector('#calendar-tray-list');
    const sortedUpcoming = events
      .filter(e => e.date >= new Date(Date.now() - 24 * 60 * 60 * 1000))
      .sort((a, b) => a.date - b.date);

    if (sortedUpcoming.length === 0) {
      trayList.innerHTML = `<div class="tray-empty">No milestones scheduled for this month. Set a milestone date on any application!</div>`;
    } else {
      trayList.innerHTML = sortedUpcoming.map(ev => {
        const timeStr = ev.date.toLocaleDateString(undefined, { 
          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
        const gCalUrl = notifications.getGoogleCalendarUrl(ev.job);

        return `
          <div class="tray-item" data-job-id="${ev.job.id}">
            <div class="tray-item-left">
              <span class="tray-badge-type">${this.escape(ev.job.milestoneType || 'Milestone')}</span>
              <strong>${this.escape(ev.job.company)}</strong> - <span>${this.escape(ev.job.role || 'Role')}</span>
              <div class="tray-date">${timeStr}</div>
            </div>
            <div class="tray-item-right">
              ${gCalUrl ? `
                <a href="${gCalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" title="Add to Google Calendar">
                  + Google Cal
                </a>
              ` : ''}
              <button class="btn btn-secondary btn-sm btn-ics-tray" data-job-id="${ev.job.id}" title="Download .ics file">
                .ics
              </button>
              <button class="btn btn-primary btn-sm btn-view-tray" data-job-id="${ev.job.id}">
                View
              </button>
            </div>
          </div>
        `;
      }).join('');

      trayList.querySelectorAll('.btn-ics-tray').forEach(btn => {
        btn.addEventListener('click', () => {
          const job = storage.getJob(btn.dataset.jobId);
          if (job) notifications.downloadIcsFile(job);
        });
      });

      trayList.querySelectorAll('.btn-view-tray').forEach(btn => {
        btn.addEventListener('click', () => {
          const job = storage.getJob(btn.dataset.jobId);
          if (job) this.onOpenDetail(job);
        });
      });
    }

    // Attach navigation listeners
    this.container.querySelector('#cal-prev').addEventListener('click', () => {
      this.currentDate = new Date(year, month - 1, 1);
      this.render();
    });

    this.container.querySelector('#cal-next').addEventListener('click', () => {
      this.currentDate = new Date(year, month + 1, 1);
      this.render();
    });

    this.container.querySelector('#cal-today').addEventListener('click', () => {
      this.currentDate = new Date();
      this.render();
    });
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
}
