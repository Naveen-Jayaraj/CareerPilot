/**
 * Cloud Sync Manager - Connects to Free Supabase PostgreSQL Server
 * Supports Realtime multi-device sync, row level security, and backup.
 */
import { storage } from './storage.js';

class CloudSyncManager {
  constructor() {
    this.client = null;
    this.syncStatus = 'disconnected'; // 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error'
    this.lastSyncTime = null;
    this.subscription = null;
    this.init();
  }

  init() {
    const settings = storage.getSettings();
    if (settings.supabaseUrl && settings.supabaseAnonKey) {
      this.connect(settings.supabaseUrl, settings.supabaseAnonKey);
    }
  }

  async connect(url, key) {
    if (!url || !key) {
      this.syncStatus = 'disconnected';
      this.notifyStatus();
      return { success: false, error: 'Missing Supabase credentials' };
    }

    try {
      this.syncStatus = 'connecting';
      this.notifyStatus();

      // Check if supabase global exists from CDN
      if (typeof window.supabase === 'undefined') {
        throw new Error('Supabase client library not loaded. Check internet connection.');
      }

      this.client = window.supabase.createClient(url.trim(), key.trim(), {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });

      // Test connection by doing a light query on job_applications
      const { data, error } = await this.client
        .from('job_applications')
        .select('id')
        .limit(1);

      if (error) {
        // If table doesn't exist yet
        if (error.code === '42P01') {
          throw new Error('Table "job_applications" does not exist yet. Please run the schema SQL in your Supabase SQL Editor.');
        }
        throw error;
      }

      this.syncStatus = 'connected';
      this.notifyStatus();

      // Save settings
      const settings = storage.getSettings();
      settings.supabaseUrl = url.trim();
      settings.supabaseAnonKey = key.trim();
      storage.saveSettings(settings);

      // Start Realtime listener
      this.startRealtimeSync();

      // Perform initial bidirectional sync
      await this.bidirectionalSync();

      return { success: true };
    } catch (err) {
      console.error('Supabase connection failed:', err);
      this.syncStatus = 'error';
      this.notifyStatus(err.message || 'Connection failed');
      return { success: false, error: err.message || 'Failed to connect to Supabase' };
    }
  }

  disconnect() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.client = null;
    this.syncStatus = 'disconnected';
    const settings = storage.getSettings();
    settings.supabaseUrl = '';
    settings.supabaseAnonKey = '';
    storage.saveSettings(settings);
    this.notifyStatus();
  }

  startRealtimeSync() {
    if (!this.client) return;

    try {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }

      this.subscription = this.client
        .channel('public:job_applications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'job_applications' }, payload => {
          console.log('Realtime DB change received from cloud:', payload);
          this.pullFromCloud();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }
  }

  async bidirectionalSync() {
    if (!this.client || this.syncStatus === 'syncing') return;

    try {
      this.syncStatus = 'syncing';
      this.notifyStatus();

      // 1. Fetch cloud records
      const { data: cloudJobs, error } = await this.client
        .from('job_applications')
        .select('*');

      if (error) throw error;

      const localJobs = storage.getJobs();

      // If cloud is empty and local has items (first time setup), push all local items to cloud
      if ((!cloudJobs || cloudJobs.length === 0) && localJobs.length > 0) {
        await this.pushAllToCloud(localJobs);
      } else {
        // Merge strategy: map cloud records to local format
        const formattedCloudJobs = (cloudJobs || []).map(row => ({
          id: row.id,
          company: row.company,
          role: row.role,
          appliedDate: row.applied_date,
          status: row.status,
          packageLpa: row.package_lpa,
          packageNumeric: row.package_numeric,
          workMode: row.work_mode,
          jobLink: row.job_link,
          nextMilestoneDate: row.next_milestone_date,
          milestoneType: row.milestone_type,
          channel: row.channel,
          contactPerson: row.contact_person,
          location: row.location,
          notes: row.notes,
          prepChecklist: row.prep_checklist || [],
          interviewRounds: row.interview_rounds || [],
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));

        // Merge: keep newest by updatedAt
        const localMap = new Map(localJobs.map(j => [j.id, j]));
        const jobsToPush = [];

        formattedCloudJobs.forEach(cJob => {
          const lJob = localMap.get(cJob.id);
          if (!lJob) {
            localJobs.push(cJob);
          } else {
            const cTime = new Date(cJob.updatedAt || 0).getTime();
            const lTime = new Date(lJob.updatedAt || 0).getTime();
            if (cTime > lTime) {
              const idx = localJobs.findIndex(j => j.id === cJob.id);
              if (idx !== -1) localJobs[idx] = cJob;
            } else if (lTime > cTime) {
              jobsToPush.push(lJob);
            }
          }
        });

        // Also if local has jobs not in cloud, push them
        const cloudIdSet = new Set(formattedCloudJobs.map(j => j.id));
        localJobs.forEach(lJob => {
          if (!cloudIdSet.has(lJob.id)) {
            jobsToPush.push(lJob);
          }
        });

        // Save updated local jobs
        storage.jobs = localJobs;
        storage.saveToDisk();

        // Push any newer local jobs to cloud
        if (jobsToPush.length > 0) {
          for (const j of jobsToPush) {
            await this.pushSingleJob(j);
          }
        }
      }

      this.lastSyncTime = new Date();
      this.syncStatus = 'connected';
      this.notifyStatus();
    } catch (err) {
      console.error('Bidirectional sync error:', err);
      this.syncStatus = 'error';
      this.notifyStatus(err.message || 'Sync failed');
    }
  }

  async pushAllToCloud(jobs) {
    if (!this.client || jobs.length === 0) return;
    const rows = jobs.map(j => ({
      id: j.id,
      company: j.company,
      role: j.role || '',
      applied_date: j.appliedDate || null,
      status: j.status || 'Applied',
      package_lpa: j.packageLpa || '',
      package_numeric: j.packageNumeric || null,
      work_mode: j.workMode || 'On-site',
      job_link: j.jobLink || '',
      next_milestone_date: j.nextMilestoneDate ? new Date(j.nextMilestoneDate).toISOString() : null,
      milestone_type: j.milestoneType || 'Milestone',
      channel: j.channel || '',
      contact_person: j.contactPerson || '',
      location: j.location || '',
      notes: j.notes || '',
      prep_checklist: j.prepChecklist || [],
      interview_rounds: j.interviewRounds || [],
      created_at: j.createdAt || new Date().toISOString(),
      updated_at: j.updatedAt || new Date().toISOString()
    }));

    const { error } = await this.client.from('job_applications').upsert(rows);
    if (error) throw error;
  }

  async pushSingleJob(job) {
    if (!this.client) return;
    const row = {
      id: job.id,
      company: job.company,
      role: job.role || '',
      applied_date: job.appliedDate || null,
      status: job.status || 'Applied',
      package_lpa: job.packageLpa || '',
      package_numeric: job.packageNumeric || null,
      work_mode: job.workMode || 'On-site',
      job_link: job.jobLink || '',
      next_milestone_date: job.nextMilestoneDate ? new Date(job.nextMilestoneDate).toISOString() : null,
      milestone_type: job.milestoneType || 'Milestone',
      channel: job.channel || '',
      contact_person: job.contactPerson || '',
      location: job.location || '',
      notes: job.notes || '',
      prep_checklist: job.prepChecklist || [],
      interview_rounds: job.interviewRounds || [],
      created_at: job.createdAt || new Date().toISOString(),
      updated_at: job.updatedAt || new Date().toISOString()
    };
    await this.client.from('job_applications').upsert(row);
  }

  async deleteFromCloud(id) {
    if (!this.client) return;
    await this.client.from('job_applications').delete().eq('id', id);
  }

  async pullFromCloud() {
    if (!this.client) return;
    try {
      const { data, error } = await this.client.from('job_applications').select('*');
      if (error) throw error;

      if (data) {
        storage.jobs = data.map(row => ({
          id: row.id,
          company: row.company,
          role: row.role,
          appliedDate: row.applied_date,
          status: row.status,
          packageLpa: row.package_lpa,
          packageNumeric: row.package_numeric,
          workMode: row.work_mode,
          jobLink: row.job_link,
          nextMilestoneDate: row.next_milestone_date,
          milestoneType: row.milestone_type,
          channel: row.channel,
          contactPerson: row.contact_person,
          location: row.location,
          notes: row.notes,
          prepChecklist: row.prep_checklist || [],
          interviewRounds: row.interview_rounds || [],
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
        storage.saveToDisk();
      }
    } catch (e) {
      console.error('Error pulling from cloud:', e);
    }
  }

  async fetchTotpSecret() {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('user_security')
        .select('totp_secret')
        .eq('id', 'master_user')
        .maybeSingle();
      if (error || !data) return null;
      return data.totp_secret;
    } catch (e) {
      console.warn('Error fetching server TOTP secret:', e);
      return null;
    }
  }

  async saveTotpSecret(secret) {
    if (!this.client || !secret) return false;
    try {
      const { error } = await this.client
        .from('user_security')
        .upsert({
          id: 'master_user',
          totp_secret: secret,
          updated_at: new Date().toISOString()
        });
      if (error) {
        console.warn('Error saving server TOTP secret:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Error saving server TOTP secret:', e);
      return false;
    }
  }

  notifyStatus(errorMessage = '') {
    window.dispatchEvent(new CustomEvent('cloud-sync-status', {
      detail: {
        status: this.syncStatus,
        lastSync: this.lastSyncTime,
        error: errorMessage
      }
    }));
  }
}

export const cloudSync = new CloudSyncManager();
