# 🚀 CareerPilot — Job Hunt & Placement Tracker

A high-performance, feature-dense web application engineered specifically for tracking job applications, campus placements, and interviews. Built to run seamlessly on both mobile phones and desktop PCs with bank-grade private cloud sync and intelligent notification reminders.

---

## ✨ Key Features

1. **📊 Interactive Pipeline Board (Kanban)**:
   - Drag & drop or 1-tap card transitions across pipeline stages: *Wishlist → Applied → Shortlisted → OA / Exam → Interview → Offer / Placed → Rejected*.
   - Quick move popovers, compensation tags, and days-active counters.

2. **📑 Dense Spreadsheet View (Elevated Table)**:
   - Replaces clunky Google Sheets with a dense, interactive data grid.
   - Live search, multi-column sorting (Company, Role, Package LPA, Milestone Date, Application Date).
   - Filter by status and work mode (On-site, Hybrid, Remote).
   - 1-Click Excel/CSV Export and JSON Backup/Restore.

3. **⏰ Smart Notification & Reminder System**:
   - **Native System Alerts**: Browser notifications for upcoming assessments and interview dates.
   - **In-App Notification Center**: Slide-out drawer tracking urgent milestones, overdue tasks, and follow-up nudges for stale applications.
   - **Calendar Integration**: 1-Click "Add to Google Calendar" and download `.ics` calendar events compatible with Apple Calendar, Outlook, and Google Calendar.
   - **Synthesized Audio Chimes**: Gentle audio feedback on status updates and task completions.

4. **🎯 Interview Preparation & Study Hub**:
   - High-yield DSA revision checklist (Arrays, Strings, Trees, Graphs, DP, SQL, OOPs).
   - Dedicated company prep workspaces with interactive to-do lists and interview round history.
   - Behavioral STAR Method framework guide (Situation, Task, Action, Result).

5. **📈 Career Analytics & LPA Metrics**:
   - Real-time KPI summaries: Total Applied, Shortlisted, Exams & Interviews, Placed (Offers), Top Offered LPA, Active Pipeline, Average LPA.
   - Pipeline Funnel visualizer and compensation distribution breakdown.

6. **☁️ Free Secure Server Cloud Sync (Supabase)**:
   - Connects to your own free **Supabase PostgreSQL database** with **Row Level Security (RLS)**.
   - Real-time bi-directional sync across all your devices (Phone, Laptop, Tablet, PC).
   - Works 100% offline out-of-the-box with local vault fallback!

7. **📱 Mobile-First PWA (Progressive Web App)**:
   - Installable on Android & iOS home screens for an app-like experience.
   - Touch-friendly bottom navigation bar and quick-action floating button (+).

---

## 🚀 Running Locally

You can launch the web app instantly on your local computer using any static web server:

### Option A: Using Python (Pre-installed)
```bash
python -m http.server 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option B: Using Node.js / npx
```bash
npx -y serve .
```

---

## 🌐 Free Hosting Options

### 1. Host on GitHub Pages (100% Free)
1. Initialize git and push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of CareerPilot job hunt app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/job-hunt-tracker.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** → **Pages** (under "Code and automation").
   - Under **Build and deployment** → **Source**, select **Deploy from a branch**.
   - Select `main` branch and `/ (root)` folder, then click **Save**.
3. In ~60 seconds, your site will be live at `https://YOUR_USERNAME.github.io/job-hunt-tracker/`!

---

### 2. Host on Vercel (100% Free)
1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.
2. Click **Add New...** → **Project**.
3. Import your `job-hunt-tracker` repository.
4. Leave settings as default (Framework Preset: *Other*, Root Directory: `./`).
5. Click **Deploy**. Your app will be live with free SSL in 10 seconds!

---

## 🔒 Free Secure Cloud Server Setup (Supabase)

To access and sync your data securely across all devices (Phone, PC, Laptop):

1. **Create Free Account**:
   - Go to [supabase.com](https://supabase.com) and click **Start your project** (Free tier gives you 500MB PostgreSQL, Auth, and SSL).
2. **Run Database Schema**:
   - In your Supabase dashboard, click **SQL Editor** on the left menu.
   - Open [supabase_schema.sql](file:///d:/Programs/Job%20Hunt/supabase_schema.sql), copy its entire contents, paste it into the SQL Editor, and click **Run**.
3. **Connect the App**:
   - In Supabase, go to **Project Settings** (gear icon) → **API**.
   - Copy your **Project URL** (e.g., `https://xyz.supabase.co`) and **Project API key** (`anon` `public`).
   - Open your deployed CareerPilot app, click the **Local Vault / Cloud Sync** button in the sidebar or menu.
   - Paste your URL and Anon Key, then click **Connect & Sync Now**.
4. **All set!** Any changes made on your mobile phone or PC will instantly sync in real-time.

---

## 📲 Installing as a Mobile App (PWA)

### On Android (Chrome / Brave / Edge):
1. Open your live app URL in mobile Chrome.
2. Tap the three dots (⋮) in the top-right corner.
3. Select **Add to Home screen** or **Install app**.
4. CareerPilot will now appear in your app drawer and home screen just like a native app!

### On iPhone / iPad (Safari):
1. Open your live app URL in Safari.
2. Tap the **Share** button (box with upward arrow) at the bottom.
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top-right corner.

---

## 📂 File Structure

```
d:\Programs\Job Hunt\
├── index.html                 # Main Single Page App structure
├── manifest.json              # PWA manifest for home screen installation
├── sw.js                      # Service Worker for offline performance
├── supabase_schema.sql        # Copy-paste SQL schema for free Supabase DB
├── vercel.json                # Vercel deployment configuration
├── README.md                  # Complete documentation and setup guide
├── css/
│   ├── main.css               # Core design tokens, dark/light theme, typography
│   ├── kanban.css             # Drag & drop pipeline board styling
│   ├── table.css              # Dense spreadsheet table styling
│   ├── calendar.css           # Calendar & timeline styling
│   ├── modal.css              # Modals and application detail view styling
│   └── notifications.css      # Notification drawer and toast alert styles
├── js/
│   ├── app.js                 # Master coordinator and view router
│   ├── storage.js             # Local-first storage with reactive dispatches
│   ├── cloudSync.js           # Supabase client integration & live sync
│   ├── notifications.js       # Web notifications, audio chimes & calendar sync
│   ├── kanbanView.js          # Interactive Kanban board view
│   ├── tableView.js           # Dense spreadsheet table view
│   ├── calendarView.js        # Milestone calendar view
│   ├── statsView.js           # Career analytics & LPA metrics dashboard
│   ├── prepView.js            # DSA checklist & interview prep hub
│   └── initialData.js         # Pre-loaded applications from Job Search.xlsx
└── assets/
    ├── icon.jpg               # High-res app logo
    ├── icon-192.png           # 192px PWA icon
    ├── icon-512.png           # 512px PWA icon
    └── favicon.png            # App favicon
```
