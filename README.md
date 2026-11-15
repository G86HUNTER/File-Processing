# ☁️ Scalable Serverless Folder Processing Pipeline & Monitoring Dashboard
**Course:** Cloud Computing Course Project (CC CP)  
**Author:** Aryan Gaikwad  
**Design Reference:** Google Cloud Platform (GCP) Console / Google Drive Material 3  

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

### Option A: Standalone Real-Time Cluster Console (Recommended)
At the root directory (`CC CP/`), double click `start.bat` or run:
```bash
node server.js
```
Open [http://localhost:3000](http://localhost:3000)

### Option B: React Vite Frontend
Inside `File-Processing-main/`:
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)
