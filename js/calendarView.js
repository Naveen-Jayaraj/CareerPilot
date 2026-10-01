/**
 * Rock-Solid Calendar View - Grid & Agenda Timeline Modes
 * Fixed uniform heights prevent cell stretching or grid wobbling across all screen sizes.
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
    this.viewMode = window.innerWidth <= 640 ? 'agenda' : 'grid'; // Auto agenda on mobile
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
      <!-- Calendar Control Header -->
      <div class="calendar-header-bar">
        <div class="cal-header-left">
          <h2 style="font-size: 1.15rem; font-weight: 700;">${monthNames[month]} ${year}</h2>
          <span style="font-size: 0.78rem; color: var(--text-secondary);">Scheduled tests, interviews, and deadlines</span>
        </div>

        <div class="cal-header-right">
          <!-- Grid / Agenda Toggle -->
          <div class="cal-view-toggle">
            <button class="cal-toggle-btn ${this.viewMode === 'grid' ? 'active' : ''}" id="btn-mode-grid">
              Grid
            </button>
            <button class="cal-toggle-btn ${this.viewMode === 'agenda' ? 'active' : ''}" id="btn-mode-agenda">
              Agenda
            </button>
          </div>

          <!-- Nav Btns -->
          <div class="cal-nav-btns">
            <button id="cal-prev" class="btn btn-secondary btn-xs">Prev</button>
            <button id="cal-today" class="btn btn-secondary btn-xs">Today</button>
            <button id="cal-next" class="btn btn-secondary btn-xs">Next</button>
          </div>
        </div>
      </div>

      <!-- Main Body Container -->
      <div class="cal-card">
        ${this.viewMode === 'grid' ? this.renderGridHTML(year, month, events) : this.renderAgendaHTML(events)}
      </div>

      <!-- Upcoming Milestones Tray -->
      <div class="cal-upcoming-card">
        <div class="cal-upcoming-header">
          <span style="font-weight: 600; font-size: 0.85rem;">Upcoming Milestone Action Center</span>
          <span class="column-count">${events.filter(e => e.date >= new Date(Date.now() - 24 * 60 * 60 * 1000)).length} Active</span>
        </div>
        <div class="cal-upcoming-list" id="calendar-tray-list">
          ${this.renderTrayHTML(events)}
        </div>
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

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cellsHtml += `
        <div class="cal-day-cell cal-day-outside">
          <div class="day-num-bar"><span class="day-num">${prevMonthTotalDays - i}</span></div>
        </div>
      `;
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateKey === todayKey;
      const dayEvents = events.filter(e => e.dateKey === dateKey);

      let eventsChipsHtml = '';
      if (dayEvents.length > 0) {
        // Max 2 visible in grid to prevent height wobbling
        const visibleEvents = dayEvents.slice(0, 2);
        const extraCount = dayEvents.length - 2;

        eventsChipsHtml = `
          <div class="day-events-wrap">
            ${visibleEvents.map(ev => `
              <div class="cal-event-chip" data-job-id="${ev.job.id}" title="${this.escape(ev.title)}">
                <span class="event-indicator"></span>
                <span>${this.escape(ev.job.company)}</span>
              </div>
            `).join('')}
            ${extraCount > 0 ? `<span class="more-events-indicator">+${extraCount} more</span>` : ''}
          </div>
        `;
      }

      cellsHtml += `
        <div class="cal-day-cell ${isToday ? 'cal-day-today' : ''}" data-date-key="${dateKey}">
          <div class="day-num-bar">
            <span class="day-num">${d}</span>
          </div>
          ${eventsChipsHtml}
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
    const sortedEvents = events.sort((a, b) => a.date - b.date);

    if (sortedEvents.length === 0) {
      return `<div class="tray-empty">No milestones or deadlines scheduled. Set milestone dates on your applications!</div>`;
    }

    // Group events by dateKey
    const grouped = {};
    sortedEvents.forEach(ev => {
      grouped[ev.dateKey] = grouped[ev.dateKey] || [];
      grouped[ev.dateKey].push(ev);
    });

    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

    return `
      <div class="cal-agenda-container">
        ${Object.entries(grouped).map(([dateKey, dayEvents]) => {
          const d = dayEvents[0].date;
          const dateTitle = d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
          const isToday = dateKey === todayStr;

          return `
            <div class="agenda-day-group">
              <div class="agenda-day-header">
                ${icons.calendar}
                <span>${dateTitle}</span>
                ${isToday ? '<span class="agenda-today-tag">Today</span>' : ''}
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${dayEvents.map(ev => {
                  const gCal = notifications.getGoogleCalendarUrl(ev.job);
                  return `
                    <div class="cal-tray-row" data-job-id="${ev.job.id}">
                      <div class="cal-tray-left">
                        <div class="tray-type-badge">${this.escape(ev.job.milestoneType || 'Milestone')}</div>
                        <div class="tray-title"><strong>${this.escape(ev.job.company)}</strong> — <span>${this.escape(ev.job.role || 'Role')}</span></div>
                        <div class="tray-date">${ev.date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div class="cal-tray-right">
                        ${gCal ? `<a href="${gCal}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs">+ Google Cal</a>` : ''}
                        <button class="btn btn-secondary btn-xs btn-ics-tray" data-job-id="${ev.job.id}">.ics</button>
                        <button class="btn btn-primary btn-xs btn-view-tray" data-job-id="${ev.job.id}">View</button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderTrayHTML(events) {
    const sortedUpcoming = events
      .filter(e => e.date >= new Date(Date.now() - 24 * 60 * 60 * 1000))
      .sort((a, b) => a.date - b.date);

    if (sortedUpcoming.length === 0) {
      return `<div class="tray-empty">No upcoming milestones.</div>`;
    }

    return sortedUpcoming.map(ev => {
      const timeStr = ev.date.toLocaleDateString(undefined, { 
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
      const gCalUrl = notifications.getGoogleCalendarUrl(ev.job);

      return `
        <div class="cal-tray-row" data-job-id="${ev.job.id}">
          <div class="cal-tray-left">
            <div class="tray-type-badge">${this.escape(ev.job.milestoneType || 'Milestone')}</div>
            <div class="tray-title"><strong>${this.escape(ev.job.company)}</strong> — <span>${this.escape(ev.job.role || 'Role')}</span></div>
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
  }

  attachEventListeners(year, month, events) {
    // Mode toggles
    this.container.querySelector('#btn-mode-grid')?.addEventListener('click', () => {
      this.viewMode = 'grid';
      this.render();
    });

    this.container.querySelector('#btn-mode-agenda')?.addEventListener('click', () => {
      this.viewMode = 'agenda';
      this.render();
    });

    // Nav
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

    // Grid event clicks
    this.container.querySelectorAll('.cal-event-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const job = storage.getJob(chip.dataset.jobId);
        if (job) this.onOpenDetail(job);
      });
    });

    // Tray & Agenda clicks
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
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
}
