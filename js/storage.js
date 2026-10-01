/**
 * Storage Manager - Local-first database with IndexedDB/LocalStorage fallback
 * Dispatches custom events so UI views update reactively.
 */
import { INITIAL_JOBS } from './initialData.js';

const STORAGE_KEY = 'job_hunt_tracker_data_v1';
const SETTINGS_KEY = 'job_hunt_tracker_settings_v1';

class StorageManager {
  constructor() {
    this.jobs = [];
    this.init();
  }

  init() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.jobs = [...INITIAL_JOBS];
      this.saveToDisk();
    } else {
      try {
        this.jobs = JSON.parse(raw);
        if (!Array.isArray(this.jobs) || this.jobs.length === 0) {
          this.jobs = [...INITIAL_JOBS];
          this.saveToDisk();
        }
      } catch (err) {
        console.error("Failed to parse local storage, loading defaults", err);
        this.jobs = [...INITIAL_JOBS];
        this.saveToDisk();
      }
    }
  }

  saveToDisk() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.jobs));
    window.dispatchEvent(new CustomEvent('jobs-updated', { detail: { jobs: this.jobs } }));
  }

  getJobs() {
    return this.jobs.filter(j => j && j.id !== '__server_totp_config__');
  }

  getJob(id) {
    return this.jobs.find(j => j.id === id) || null;
  }

  saveJob(jobData) {
    const now = new Date().toISOString();
    const existingIndex = this.jobs.findIndex(j => j.id === jobData.id);

    // Calculate numeric package
    let numeric = null;
    if (jobData.packageLpa) {
      const match = String(jobData.packageLpa).match(/(\d+(\.\d+)?)/);
      if (match) {
        numeric = parseFloat(match[1]);
        // If range like "4.5 - 10.5", take upper bound
        const allMatches = [...String(jobData.packageLpa).matchAll(/(\d+(\.\d+)?)/g)];
        if (allMatches.length > 1) {
          numeric = parseFloat(allMatches[allMatches.length - 1][1]);
        }
      }
    }

    const payload = {
      ...jobData,
      packageNumeric: numeric,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      this.jobs[existingIndex] = {
        ...this.jobs[existingIndex],
        ...payload
      };
    } else {
      payload.id = payload.id || `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      payload.createdAt = now;
      payload.prepChecklist = payload.prepChecklist || [];
      payload.interviewRounds = payload.interviewRounds || [];
      this.jobs.unshift(payload);
    }

    this.saveToDisk();
    return payload;
  }

  updateJobStatus(id, newStatus) {
    const job = this.jobs.find(j => j.id === id);
    if (job) {
      job.status = newStatus;
      job.updatedAt = new Date().toISOString();
      this.saveToDisk();
      return true;
    }
    return false;
  }

  deleteJob(id) {
    this.jobs = this.jobs.filter(j => j.id !== id);
    this.saveToDisk();
  }

  getStats() {
    const total = this.jobs.length;
    const shortlisted = this.jobs.filter(j => j.status === 'Shortlisted').length;
    const interviewCount = this.jobs.filter(j => ['Exam', 'Interview'].includes(j.status)).length;
    const offers = this.jobs.filter(j => j.status === 'Offer' || j.status === 'Placed').length;
    const rejected = this.jobs.filter(j => j.status === 'Rejected').length;
    const activePipeline = this.jobs.filter(j => !['Offer', 'Placed', 'Rejected'].includes(j.status)).length;

    // Highest LPA
    let maxLpa = 0;
    let sumLpa = 0;
    let countNumeric = 0;

    this.jobs.forEach(j => {
      if (typeof j.packageNumeric === 'number' && !isNaN(j.packageNumeric) && j.packageNumeric > 0) {
        if (j.packageNumeric > maxLpa) maxLpa = j.packageNumeric;
        sumLpa += j.packageNumeric;
        countNumeric++;
      }
    });

    const avgLpa = countNumeric > 0 ? (sumLpa / countNumeric).toFixed(1) : 0;

    return {
      total,
      shortlisted,
      interviewCount,
      offers,
      rejected,
      activePipeline,
      maxLpa: maxLpa > 0 ? `${maxLpa} LPA` : 'N/A',
      avgLpa: avgLpa > 0 ? `${avgLpa} LPA` : 'N/A'
    };
  }

  // Export JSON
  exportJSON() {
    const blob = new Blob([JSON.stringify(this.jobs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Job_Hunt_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export CSV (Excel compatible)
  exportCSV() {
    const headers = [
      'Company', 'Role', 'Status', 'Package LPA', 'Work Mode', 
      'Application Date', 'Next Milestone Date', 'Channel', 'Job Link', 'Notes'
    ];

    const rows = this.jobs.map(j => [
      `"${(j.company || '').replace(/"/g, '""')}"`,
      `"${(j.role || '').replace(/"/g, '""')}"`,
      `"${(j.status || '').replace(/"/g, '""')}"`,
      `"${(j.packageLpa || '').replace(/"/g, '""')}"`,
      `"${(j.workMode || '').replace(/"/g, '""')}"`,
      `"${j.appliedDate || ''}"`,
      `"${j.nextMilestoneDate || ''}"`,
      `"${(j.channel || '').replace(/"/g, '""')}"`,
      `"${(j.jobLink || '').replace(/"/g, '""')}"`,
      `"${(j.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Job_Hunt_Applications_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import JSON or CSV
  importData(jsonArray) {
    if (!Array.isArray(jsonArray) || jsonArray.length === 0) {
      throw new Error("Invalid format: expected non-empty array");
    }
    // merge by id or company+role
    let addedCount = 0;
    jsonArray.forEach(item => {
      if (item && item.company) {
        const id = item.id || `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const existingIdx = this.jobs.findIndex(j => j.id === id || (j.company === item.company && j.role === item.role));
        if (existingIdx >= 0) {
          this.jobs[existingIdx] = { ...this.jobs[existingIdx], ...item, id: this.jobs[existingIdx].id };
        } else {
          this.jobs.unshift({ ...item, id });
          addedCount++;
        }
      }
    });
    this.saveToDisk();
    return addedCount;
  }

  // Settings
  getSettings() {
    const defaults = {
      supabaseUrl: 'https://kanqtodkjopmxoihvkso.supabase.co',
      supabaseAnonKey: 'sb_publishable_8baeFmQZZTFFlJvfVWfSEQ_1p_BIB54',
      autoSync: true,
      notificationLeadDays: 1,
      soundEnabled: true,
      theme: 'cyber-dark'
    };

    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      if (!parsed.supabaseUrl) parsed.supabaseUrl = defaults.supabaseUrl;
      if (!parsed.supabaseAnonKey) parsed.supabaseAnonKey = defaults.supabaseAnonKey;
      return parsed;
    } catch {
      return defaults;
    }
  }

  saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('settings-updated', { detail: { settings } }));
  }
}

export const storage = new StorageManager();
