/**
 * Notifications & Reminders Engine
 * Handles Web Notifications API, In-app Reminder Center, Audio Chimes, and Calendar Sync (.ics + Google Calendar)
 */
import { storage } from './storage.js';

class NotificationManager {
  constructor() {
    this.permission = 'default';
    this.reminders = [];
    this.audioContext = null;
    this.init();
  }

  init() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
    this.checkReminders();
    
    // Check reminders every 10 minutes and on visibility change
    setInterval(() => this.checkReminders(), 10 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.checkReminders();
    });

    window.addEventListener('jobs-updated', () => {
      this.checkReminders();
    });
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      this.showToast('Browser Notifications not supported on this device', 'warning');
      return false;
    }

    try {
      const res = await Notification.requestPermission();
      this.permission = res;
      if (res === 'granted') {
        this.showToast('System notifications enabled! You will get alerts for upcoming interviews & milestones.', 'success');
        this.sendSystemNotification('Notifications Active', 'Job Hunt Tracker will alert you about your milestone dates.');
        this.playChime('success');
      } else {
        this.showToast('Notification permission denied or dismissed.', 'info');
      }
      return res === 'granted';
    } catch (e) {
      console.warn('Notification permission error:', e);
      return false;
    }
  }

  checkReminders() {
    const jobs = storage.getJobs();
    const settings = storage.getSettings();
    const leadDays = settings.notificationLeadDays || 2;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const alerts = [];

    jobs.forEach(job => {
      // 1. Next Milestone Date Check
      if (job.nextMilestoneDate) {
        const mDate = new Date(job.nextMilestoneDate);
        if (!isNaN(mDate.getTime())) {
          const diffMs = mDate.getTime() - now.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          const diffDays = Math.ceil(diffHours / 24);

          if (diffHours >= -24 && diffHours < 0) {
            // Milestone today but passed earlier today
            alerts.push({
              id: `${job.id}_today`,
              jobId: job.id,
              type: 'milestone-today',
              urgency: 'high',
              title: `${job.company} - Milestone Today!`,
              message: `${job.milestoneType || 'Milestone'} scheduled for today (${job.role || 'Job'}).`,
              date: job.nextMilestoneDate,
              job
            });
          } else if (diffHours >= 0 && diffHours <= (leadDays * 24)) {
            // Upcoming in lead days
            const dayLabel = diffDays <= 1 ? 'Tomorrow' : `in ${diffDays} days`;
            alerts.push({
              id: `${job.id}_upcoming`,
              jobId: job.id,
              type: 'milestone-upcoming',
              urgency: diffDays <= 1 ? 'high' : 'medium',
              title: `Upcoming: ${job.company} ${job.milestoneType || 'Milestone'}`,
              message: `${job.milestoneType || 'Interview/Exam'} is due ${dayLabel} (${mDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}).`,
              date: job.nextMilestoneDate,
              job
            });
          } else if (diffHours < -24 && !['Offer', 'Placed', 'Rejected'].includes(job.status)) {
            // Overdue
            alerts.push({
              id: `${job.id}_overdue`,
              jobId: job.id,
              type: 'milestone-overdue',
              urgency: 'warning',
              title: `Milestone Overdue: ${job.company}`,
              message: `Scheduled date has passed (${mDate.toLocaleDateString()}). Don't forget to record outcome or update status!`,
              date: job.nextMilestoneDate,
              job
            });
          }
        }
      }

      // 2. Stale Application Nudge (> 14 days with no response)
      if (job.status === 'Applied' && job.appliedDate) {
        const appDate = new Date(job.appliedDate);
        const daysAgo = Math.floor((now - appDate) / (1000 * 60 * 60 * 24));
        if (daysAgo >= 14 && !job.nextMilestoneDate) {
          alerts.push({
            id: `${job.id}_stale`,
            jobId: job.id,
            type: 'nudge-followup',
            urgency: 'low',
            title: `Follow Up Nudge: ${job.company}`,
            message: `Applied ${daysAgo} days ago for ${job.role || 'Role'}. Time to check portal or connect with recruiter on LinkedIn!`,
            date: job.appliedDate,
            job
          });
        }
      }
    });

    this.reminders = alerts;
    this.updateNotificationBadge();

    // Trigger system notification if any high urgency item hasn't been notified this session
    const sessionKey = 'job_hunt_notified_' + todayStr;
    const notifiedList = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
    const highAlerts = alerts.filter(a => a.urgency === 'high');

    highAlerts.forEach(a => {
      if (!notifiedList.includes(a.id)) {
        if (this.permission === 'granted') {
          this.sendSystemNotification(a.title, a.message);
        }
        notifiedList.push(a.id);
      }
    });

    sessionStorage.setItem(sessionKey, JSON.stringify(notifiedList));
    return this.reminders;
  }

  sendSystemNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification(title, {
          body,
          icon: './assets/icon-192.png',
          badge: './assets/favicon.png',
          tag: 'job-milestone'
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch (e) {
        console.warn('System notification error:', e);
      }
    }
  }

  updateNotificationBadge() {
    const badgeElements = document.querySelectorAll('.notification-count-badge');
    const count = this.reminders.length;
    badgeElements.forEach(el => {
      if (count > 0) {
        el.textContent = count > 99 ? '99+' : count;
        el.style.display = 'inline-flex';
        el.classList.add('has-notifications');
      } else {
        el.style.display = 'none';
        el.classList.remove('has-notifications');
      }
    });
  }

  playChime(type = 'default') {
    const settings = storage.getSettings();
    if (settings.soundEnabled === false) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      const now = this.audioContext.currentTime;
      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.12); // C5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch (e) {
      // Audio autoplay might be blocked before first user interaction
    }
  }

  showToast(message, type = 'info', duration = 3800) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    } else {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-msg">${message}</div>
      <button class="toast-close" aria-label="Dismiss">&times;</button>
    `;

    toast.querySelector('.toast-close').onclick = () => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 250);
    };

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }

  // Generate Google Calendar Link
  getGoogleCalendarUrl(job) {
    if (!job.nextMilestoneDate) return null;
    const start = new Date(job.nextMilestoneDate);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const fmt = d => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const title = encodeURIComponent(`[${job.company}] ${job.milestoneType || 'Interview / Milestone'} - ${job.role || 'Job'}`);
    const details = encodeURIComponent(
      `Company: ${job.company}\nRole: ${job.role || 'N/A'}\nPackage: ${job.packageLpa || 'N/A'}\nLink: ${job.jobLink || 'N/A'}\nNotes: ${job.notes || 'None'}`
    );
    const location = encodeURIComponent(job.location || job.workMode || 'Remote / Online');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}&location=${location}`;
  }

  // Generate and Download .ics iCalendar file
  downloadIcsFile(job) {
    if (!job.nextMilestoneDate) {
      this.showToast('No milestone date set for this job', 'warning');
      return;
    }
    const start = new Date(job.nextMilestoneDate);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = d => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//JobHuntPro//CareerTracker//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${job.id}@jobhuntpro.app`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${job.company} - ${job.milestoneType || 'Interview'} (${job.role || ''})`,
      `DESCRIPTION:${(job.notes || 'Job milestone event').replace(/\n/g, '\\n')}`,
      `LOCATION:${job.location || job.workMode || 'Online'}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Job milestone in 1 hour',
      'TRIGGER:-PT60M',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.company.replace(/\s+/g, '_')}_Milestone.ics`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast(`Calendar event (.ics) downloaded for ${job.company}!`, 'success');
  }
}

export const notifications = new NotificationManager();
