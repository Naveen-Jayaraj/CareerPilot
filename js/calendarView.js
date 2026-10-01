/**
 * Calendar View - Linear Style (Pure SVG icons, clean grid)
 */
import { storage } from './storage.js';
import { notifications } from './notifications.js';
import { icons } from './icons.js';

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

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    this.container.innerHTML = `
      <div class="calendar-header-bar">
        <div>
          <h2 style="font-size: 1.15rem; font-weight: 700;">${monthNames[month]} ${year}</h2>
          <span style="font-size: 0.78rem; color: var(--text-secondary);">Scheduled tests, interviews, and deadlines</span>
        </div>
        <div class="cal-nav-btns">
          <button id="cal-prev" class="btn btn-secondary btn-xs">Prev</button>
          <button id="cal-today" class="btn btn-secondary btn-xs">Today</button>
          <button id="cal-next" class="btn btn-secondary btn-xs">Next</button>
        </div>
      </div>

      <div class="cal-card">
        <div class="cal-weekdays-grid">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div class="cal-days-matrix" id="calendar-days-grid"></div>
      </div>

      <div class="cal-upcoming-card">
        <div class="cal-upcoming-header">
          <span style="font-weight: 600; font-size: 0.85rem;">Upcoming Milestones</span>
          <span class="column-count">${events.filter(e => e.date >= new Date()).length}</span>
        </div>
        <div class="cal-upcoming-list" id="calendar-tray-list"></div>
      </div>
    `;

    const daysGrid = this.container.querySelector('#calendar-days-grid');
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell cal-day-outside';
      cell.innerHTML = `<span class="day-num">${prevMonthTotalDays - i}</span>`;
      daysGrid.appendChild(cell);
    }

    // Days
    for (let d = 1; d <= totalDays; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell';
      if (dateKey === todayKey) cell.classList.add('cal-day-today');

      const dayEvents = events.filter(e => e.dateKey === dateKey);

      let eventsHtml = '';
      if (dayEvents.length > 0) {
        eventsHtml = `<div class="day-events-wrap">
          ${dayEvents.map(ev => `
            <div class="cal-event-chip" data-job-id="${ev.job.id}" title="${this.escape(ev.title)}">
              <span class="event-indicator"></span>
              <span class="event-name">${this.escape(ev.job.company)}</span>
            </div>
          `).join('')}
        </div>`;
      }

      cell.innerHTML = `
        <div class="day-num-bar"><span class="day-num">${d}</span></div>
        ${eventsHtml}
      `;

      cell.querySelectorAll('.cal-event-chip').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          const job = storage.getJob(b.dataset.jobId);
          if (job) this.onOpenDetail(job);
        });
      });

      daysGrid.appendChild(cell);
    }

    // Upcoming tray
    const trayList = this.container.querySelector('#calendar-tray-list');
    const sortedUpcoming = events
      .filter(e => e.date >= new Date(Date.now() - 24 * 60 * 60 * 1000))
      .sort((a, b) => a.date - b.date);

    if (sortedUpcoming.length === 0) {
      trayList.innerHTML = `<div class="tray-empty">No milestones scheduled this month.</div>`;
    } else {
      trayList.innerHTML = sortedUpcoming.map(ev => {
        const timeStr = ev.date.toLocaleDateString(undefined, { 
          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
        const gCalUrl = notifications.getGoogleCalendarUrl(ev.job);

        return `
          <div class="cal-tray-row" data-job-id="${ev.job.id}">
            <div class="cal-tray-left">
              <div class="tray-type-badge">${this.escape(ev.job.milestoneType || 'Milestone')}</div>
              <div class="tray-title"><strong>${this.escape(ev.job.company)}</strong> - <span>${this.escape(ev.job.role || 'Role')}</span></div>
              <div class="tray-date">${timeStr}</div>
            </div>
            <div class="cal-tray-right">
              ${gCalUrl ? `
                <a href="${gCalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs" title="Google Calendar">
                  + Google Cal
                </a>
              ` : ''}
              <button class="btn btn-secondary btn-xs btn-ics-tray" data-job-id="${ev.job.id}" title="Download .ics">
                ${icons.calendar} .ics
              </button>
              <button class="btn btn-primary btn-xs btn-view-tray" data-job-id="${ev.job.id}">
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
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
}
