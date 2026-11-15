# ☁️ Scalable Serverless Folder Processing Pipeline & Monitoring Dashboard

**Course:** Cloud Computing Course Project (CC CP)  
**Author:** Aryan Gaikwad  
**Design Reference:** Google Cloud Platform (GCP) Console / Google Drive Material 3  

🌐 **Live Public Website:** [https://g86hunter.github.io/File-Processing/](https://g86hunter.github.io/File-Processing/)  
📦 **GitHub Repository:** [https://github.com/G86HUNTER/File-Processing](https://github.com/G86HUNTER/File-Processing)  

---

## 📌 Project Overview

An advanced, highly-scalable cloud folder ingestion and processing pipeline. Built to prove to the professor that when **multiple concurrent users upload folders simultaneously**, the cloud infrastructure scales horizontally without dropping connections, and if any upload is rejected, the dashboard **explicitly reports the folder as not uploaded along with the actual reason and user name**.

---

## 🚀 Key Capabilities

1. **Folder & Directory Uploading:**
   - Full nested directory support via `webkitdirectory` or drag-and-drop.
   - Preserves folder tree structures, file counts, and sizes.

2. **Multi-User Identification & Concurrency:**
   - Every upload is attributed to a user identity (e.g. `aryan.gaikwad`, `cloud.admin`, `student_rahul`, `guest_user`).
   - Handles simultaneous multi-tenant ingestion without bottlenecks.

3. **Explicit Failure Diagnostics (Exact Reason Display):**
   - If an upload fails, the dashboard displays:
     - ❌ **FAILED** status pill
     - **Folder Name**
     - **User Name**
     - **Exact Reason**, such as:
       - `Storage Quota Exceeded`: Tenant exceeded their storage cap.
       - `Security Policy Violation`: Banned script/executable (`.exe`, `.bat`, `.sh`, `.vbs`) found in folder.
       - `Directory Depth Limit Exceeded`: Recursive nesting exceeds limits.
       - `File Count Limit Exceeded`: Too many files in a single folder.

4. **Professor Demonstration Suite (Scalability Stress Test):**
   - Built-in simulation tool to demonstrate 5 to 50 concurrent virtual users uploading folders at once.
   - Shows autoscaling worker pods scaling out and in under traffic.

5. **Google Cloud Aesthetic:**
   - Official Google color palette (Google Blue `#1a73e8`, Red `#ea4335`, Yellow `#f9ab00`, Green `#1e8e3e`).
   - Google Sans typography, card elevation, and smooth transitions.

---

## 🏃 Running the Project

> **No npm install required for Option A** — the cluster console uses pure Node.js built-ins only.

---

### Option A: Standalone Real-Time Cluster Console ⭐ Recommended

This is the **primary demo mode** — a live Google Cloud-style monitoring dashboard with real-time SSE streaming, multi-user upload simulation, failure diagnostics, and scalability stress testing.

**Prerequisites:** Node.js 16+ installed

```bash
# 1. Navigate to the project root
cd "CC CP"

# 2. Start the server (zero dependencies — pure Node.js)
node server.js

# 3. Open the dashboard
# → http://localhost:3000
```

> **Shortcut:** Double-click `start.bat` in the `CC CP/` root folder — it does all of the above automatically.

**What you'll see:**
- 📊 Live upload feed with real-time status (success / failed)
- ❌ Failed folders listed with **exact reason** + **username**
- 📈 Scalability metrics: throughput, concurrent users, success rate
- 🔥 Stress Test button — simulates 5–50 concurrent users instantly
- 🖥️ Worker pod autoscaling visualization

---

### Option B: React Vite Frontend

A full React SPA with routing (Home → Upload → Dashboard → History → File Details).

**Prerequisites:** Node.js 16+ and npm installed

```bash
# 1. Navigate to the React app directory
cd "CC CP/File-Processing-main"

# 2. Install dependencies
npm install

# 3. Start the Vite dev server
npm run dev

# 4. Open the app
# → http://localhost:5173
```

---

### Option C: Live Public Website (No Setup Required) 🌐

The dashboard is deployed publicly on GitHub Pages — **no installation needed**.

**[→ Open Live Dashboard](https://g86hunter.github.io/File-Processing/)**

> Runs entirely in the browser with client-side simulation. Perfect for sharing with the professor or demoing without a local server.

---

### Quick Comparison

| Feature | Option A (Node Server) | Option B (React Vite) | Option C (GitHub Pages) |
|---|---|---|---|
| Setup required | Node.js only | Node.js + npm | ❌ None |
| Real-time SSE | ✅ Yes | ⚠️ Partial | ✅ Simulated |
| Upload simulation | ✅ Full backend | ✅ Full frontend | ✅ Client-side |
| Failure diagnostics | ✅ Yes | ✅ Yes | ✅ Yes |
| Stress test | ✅ Yes | ✅ Yes | ✅ Yes |
| Publicly shareable | ❌ Localhost | ❌ Localhost | ✅ Yes |

---

## 📁 Project Structure

```
CC CP/
├── server.js              # Pure Node.js backend (zero deps) — Option A
├── start.bat              # One-click launcher for Option A
├── public/                # Dashboard static files served by server.js
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── File-Processing-main/  # React Vite app — Option B
    ├── src/
    │   ├── components/
    │   │   ├── FileUpload.jsx
    │   │   └── Navbar.jsx
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Home.jsx
    │   │   ├── History.jsx
    │   │   └── FileDetails.jsx
    │   └── services/
    │       └── mockStorage.js
    └── public-cluster/    # Synced copy of Option A dashboard
```

---

## 🎓 Professor Demo Guide

1. Open the **Live Dashboard**: [https://g86hunter.github.io/File-Processing/](https://g86hunter.github.io/File-Processing/)
2. Click **"Run Stress Test"** → watch 10–50 simulated users upload simultaneously
3. Observe the **Activity Feed** — each row shows user name, folder, status, and exact reason if failed
4. Check the **metrics cards** — total uploads, success rate, failed count, active users
5. Notice how the system handles all uploads — this proves **horizontal scalability**
