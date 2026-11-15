/**
 * GOOGLE CLOUD PLATFORM - SCALABLE FOLDER STORAGE & CONCURRENCY MONITOR
 * High-Performance Pure Node.js Cluster Server (Zero External Dependencies)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = fs.existsSync(path.join(__dirname, 'public-cluster')) 
  ? path.join(__dirname, 'public-cluster') 
  : path.join(__dirname, 'public');
const UPLOADS_ROOT = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

// MIME Types for Static Files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Global Cluster State & Scalability Metrics
const systemState = {
  totalUploads: 0,
  successfulUploads: 0,
  failedUploads: 0,
  totalBytesStored: 0,
  activeConcurrentRequests: 0,
  peakConcurrentRequests: 0,
  currentPods: 2,
  minPods: 2,
  maxPods: 10,
  cpuUsage: 14.5,
  memoryUsage: 28.2,
  avgLatencyMs: 38,
  requestsPerSecond: 0,
  recentRequestsWindow: [],
  folders: [],
  pods: [
    { id: 'pod-worker-01', region: 'us-central1-a', status: 'ACTIVE', load: 12, processedCount: 0 },
    { id: 'pod-worker-02', region: 'us-central1-b', status: 'ACTIVE', load: 8, processedCount: 0 }
  ]
};

// Tenant Quotas & Security Configuration
const USER_CONFIGS = {
  'aryan.gaikwad': { quotaBytes: 150 * 1024 * 1024, usedBytes: 0, maxFilesPerFolder: 500 },
  'cloud.admin': { quotaBytes: 1024 * 1024 * 1024, usedBytes: 0, maxFilesPerFolder: 1000 },
  'student_rahul': { quotaBytes: 50 * 1024 * 1024, usedBytes: 0, maxFilesPerFolder: 100 },
  'guest_user': { quotaBytes: 25 * 1024 * 1024, usedBytes: 0, maxFilesPerFolder: 50 }
};

const BANNED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.vbs', '.msi', '.scr', '.sh'];

// SSE Clients for Real-Time Push to Dashboards
let sseClients = [];

function broadcastSSE(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    try {
      sseClients[i].res.write(payload);
    } catch (err) {
      sseClients.splice(i, 1);
    }
  }
}

// Auto-Scaling & Load Balancer Engine
function updateAutoScaling() {
  const activeReq = systemState.activeConcurrentRequests;
  if (activeReq > systemState.peakConcurrentRequests) {
    systemState.peakConcurrentRequests = activeReq;
  }

  // Calculate target pods based on concurrency
  let targetPods = Math.max(systemState.minPods, Math.min(systemState.maxPods, Math.ceil(activeReq / 2.5) + 2));

  // Scale out
  while (systemState.pods.length < targetPods) {
    const podNum = systemState.pods.length + 1;
    const zones = ['a', 'b', 'c', 'f'];
    const zone = zones[podNum % zones.length];
    const newPod = {
      id: `pod-worker-${String(podNum).padStart(2, '0')}`,
      region: `us-central1-${zone}`,
      status: 'PROVISIONING',
      load: 0,
      processedCount: 0
    };
    systemState.pods.push(newPod);
    setTimeout(() => { newPod.status = 'ACTIVE'; }, 600);
  }

  // Scale in (slowly if idle)
  if (activeReq === 0 && systemState.pods.length > systemState.minPods) {
    systemState.pods.pop();
  }

  systemState.currentPods = systemState.pods.length;
  systemState.cpuUsage = Math.min(96, Math.max(12, Math.round(14 + (activeReq * 5.8) + Math.random() * 4)));
  systemState.memoryUsage = Math.min(92, Math.max(24, Math.round(28 + (activeReq * 2.8) + Math.random() * 2)));
  systemState.avgLatencyMs = Math.round(35 + (activeReq * 10) + (Math.random() * 6));

  // Distribute load among active pods
  systemState.pods.forEach(pod => {
    if (pod.status === 'ACTIVE') {
      pod.load = activeReq > 0 ? Math.round((activeReq / systemState.pods.length) * 22 + Math.random() * 12) : Math.round(Math.random() * 4);
    }
  });

  // Calculate RPS
  const now = Date.now();
  systemState.recentRequestsWindow = systemState.recentRequestsWindow.filter(t => now - t < 5000);
  systemState.requestsPerSecond = Number((systemState.recentRequestsWindow.length / 5).toFixed(1));

  broadcastSSE('system_metrics', getSystemStats());
}

setInterval(updateAutoScaling, 1500);

// Helper: Pick least loaded active worker pod
function assignWorkerPod() {
  const activePods = systemState.pods.filter(p => p.status === 'ACTIVE');
  if (activePods.length === 0) return systemState.pods[0] || { id: 'pod-worker-01' };
  activePods.sort((a, b) => a.load - b.load);
  const chosen = activePods[0];
  chosen.processedCount = (chosen.processedCount || 0) + 1;
  return chosen;
}

// Helper: Format bytes
function formatBytes(bytes) {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Return current system metrics snapshot
function getSystemStats() {
  return {
    totalUploads: systemState.totalUploads,
    successfulUploads: systemState.successfulUploads,
    failedUploads: systemState.failedUploads,
    successRate: systemState.totalUploads > 0 ? ((systemState.successfulUploads / systemState.totalUploads) * 100).toFixed(1) : '100.0',
    totalBytesStored: systemState.totalBytesStored,
    totalBytesFormatted: formatBytes(systemState.totalBytesStored),
    activeConcurrentRequests: systemState.activeConcurrentRequests,
    peakConcurrentRequests: systemState.peakConcurrentRequests,
    currentPods: systemState.currentPods,
    cpuUsage: systemState.cpuUsage,
    memoryUsage: systemState.memoryUsage,
    avgLatencyMs: systemState.avgLatencyMs,
    requestsPerSecond: systemState.requestsPerSecond,
    pods: systemState.pods
  };
}

// Lightweight Multipart Form Parser for Folder Uploads
function parseMultipartFormData(buffer, boundary) {
  const boundaryBuf = Buffer.from('--' + boundary);
  const parts = [];
  let start = 0;

  while (true) {
    const boundaryIdx = buffer.indexOf(boundaryBuf, start);
    if (boundaryIdx === -1) break;

    const nextBoundaryIdx = buffer.indexOf(boundaryBuf, boundaryIdx + boundaryBuf.length);
    if (nextBoundaryIdx === -1) break;

    const partBuf = buffer.slice(boundaryIdx + boundaryBuf.length, nextBoundaryIdx);
    start = nextBoundaryIdx;

    // Header and Body separation
    const headerEndIdx = partBuf.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEndIdx === -1) continue;

    const headerStr = partBuf.slice(0, headerEndIdx).toString('utf-8');
    let body = partBuf.slice(headerEndIdx + 4);
    // strip trailing \r\n
    if (body.length >= 2 && body[body.length - 2] === 13 && body[body.length - 1] === 10) {
      body = body.slice(0, body.length - 2);
    }

    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);

    if (nameMatch) {
      parts.push({
        name: nameMatch[1],
        filename: filenameMatch ? filenameMatch[1] : null,
        data: body,
        headers: headerStr
      });
    }
  }

  return parts;
}

// Seed Demo Folders
function seedInitialData() {
  systemState.totalUploads = 0;
  systemState.successfulUploads = 0;
  systemState.failedUploads = 0;
  systemState.totalBytesStored = 0;
  systemState.activeConcurrentRequests = 0;
  systemState.peakConcurrentRequests = 0;
  systemState.currentPods = 2;
  systemState.folders = [];
  systemState.pods = [
    { id: 'pod-worker-01', region: 'us-central1-a', status: 'ACTIVE', load: 10, processedCount: 2 },
    { id: 'pod-worker-02', region: 'us-central1-b', status: 'ACTIVE', load: 8, processedCount: 2 }
  ];

  const demoEntries = [
    {
      id: 'fld_demo_01',
      name: 'Cloud_Kubernetes_Manifests',
      username: 'aryan.gaikwad',
      fileCount: 24,
      sizeBytes: 4.8 * 1024 * 1024,
      sizeFormatted: '4.80 MB',
      status: 'SUCCESS',
      uploadedAt: new Date(Date.now() - 360000).toISOString(),
      reason: null,
      workerPod: 'pod-worker-01',
      files: [
        { name: 'deployment.yaml', size: '3.4 KB', path: 'manifests/deployment.yaml' },
        { name: 'service.yaml', size: '1.2 KB', path: 'manifests/service.yaml' },
        { name: 'ingress.yaml', size: '2.1 KB', path: 'manifests/ingress.yaml' }
      ]
    },
    {
      id: 'fld_demo_02',
      name: 'Unauthorized_Software_Bundle',
      username: 'guest_user',
      fileCount: 6,
      sizeBytes: 88.4 * 1024 * 1024,
      sizeFormatted: '88.40 MB',
      status: 'FAILED',
      uploadedAt: new Date(Date.now() - 240000).toISOString(),
      reason: "Storage Quota Exceeded: User 'guest_user' exceeded maximum quota of 25.00 MB (Requested: +88.40 MB).",
      workerPod: 'pod-worker-02',
      files: []
    },
    {
      id: 'fld_demo_03',
      name: 'Malware_Script_Test_Payload',
      username: 'student_rahul',
      fileCount: 15,
      sizeBytes: 1.2 * 1024 * 1024,
      sizeFormatted: '1.20 MB',
      status: 'FAILED',
      uploadedAt: new Date(Date.now() - 120000).toISOString(),
      reason: "Security Policy Violation: Disallowed executable/script '.exe' found in folder file 'setup_crack.exe'.",
      workerPod: 'pod-worker-01',
      files: []
    },
    {
      id: 'fld_demo_04',
      name: 'Distributed_Database_Shards',
      username: 'cloud.admin',
      fileCount: 48,
      sizeBytes: 32.6 * 1024 * 1024,
      sizeFormatted: '32.60 MB',
      status: 'SUCCESS',
      uploadedAt: new Date(Date.now() - 60000).toISOString(),
      reason: null,
      workerPod: 'pod-worker-02',
      files: [
        { name: 'shard_01.sql', size: '10.5 MB', path: 'db/shard_01.sql' },
        { name: 'shard_02.sql', size: '11.1 MB', path: 'db/shard_02.sql' }
      ]
    }
  ];

  demoEntries.forEach(e => {
    systemState.folders.push(e);
    systemState.totalUploads++;
    if (e.status === 'SUCCESS') {
      systemState.successfulUploads++;
      systemState.totalBytesStored += e.sizeBytes;
    } else {
      systemState.failedUploads++;
    }
  });
}

seedInitialData();

// HTTP Request Handler
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 1. SSE Endpoint
  if (pathname === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const clientId = Date.now() + Math.random();
    const clientObj = { id: clientId, res };
    sseClients.push(clientObj);

    res.write(`event: init\ndata: ${JSON.stringify({ stats: getSystemStats(), folders: systemState.folders })}\n\n`);

    req.on('close', () => {
      sseClients = sseClients.filter(c => c.id !== clientId);
    });
    return;
  }

  // 2. Get Folders & Stats
  if (pathname === '/api/folders' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      stats: getSystemStats(),
      folders: systemState.folders
    }));
  }

  // 3. Reset Cluster
  if (pathname === '/api/reset' && req.method === 'POST') {
    seedInitialData();
    broadcastSSE('system_reset', { stats: getSystemStats(), folders: systemState.folders });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: 'Cluster reset successfully.' }));
  }

  // 4. Scalability Stress Test Simulation
  if (pathname === '/api/simulate-stress' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let params = {};
      try { params = JSON.parse(body); } catch (e) {}

      const userCount = Math.min(80, Math.max(3, parseInt(params.userCount || 15, 10)));
      const failureRate = Math.min(80, Math.max(0, parseInt(params.failureRate || 20, 10)));
      const testType = params.testType || 'burst';

      const simulatedUsernames = [
        'Aryan_Gaikwad', 'Prof_Sharma', 'Student_Rahul', 'Dev_Pooja', 'Cloud_Rohan',
        'Neha_Patil', 'Vikram_Singh', 'Ananya_Verma', 'Karthik_R', 'Tanvi_K',
        'Amit_Kumar', 'Sneha_Deshmukh', 'Aditya_Joshi', 'Priya_Nair', 'Siddharth_Mehta'
      ];

      const sampleFolderTypes = [
        { name: 'Research_Dataset_v2', files: 14, sizeMB: 3.4 },
        { name: 'Cloud_Microservices_Src', files: 28, sizeMB: 6.2 },
        { name: 'MachineLearning_Models', files: 8, sizeMB: 45.0 },
        { name: 'Project_Documentation_PDFs', files: 19, sizeMB: 8.8 },
        { name: 'FullStack_React_Build', files: 52, sizeMB: 18.5 },
        { name: 'Docker_Kubernetes_Configs', files: 12, sizeMB: 1.8 },
        { name: 'IoT_Sensor_Logs_2026', files: 34, sizeMB: 14.1 },
        { name: 'Android_App_Release_v1', files: 41, sizeMB: 22.6 }
      ];

      const failureReasonsPool = [
        'Storage Quota Exceeded: User allocated threshold (50MB) reached.',
        'Security Policy Violation: Disallowed executable/script (.exe/.bat) detected inside subfolder.',
        'Directory Depth Limit Exceeded: Folder exceeds maximum nesting level of 6 subdirectories.',
        'Bandwidth Rate-Limit: Exceeded 15 concurrent folder uploads per second from subnet.',
        'Checksum / Parity Mismatch: Simulated network packet corruption during chunk streaming.',
        'Tenant Auth Token Expired: Session invalid during multi-part folder dispatch.'
      ];

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: `High-concurrency stress test initiated with ${userCount} users. Auto-scaling worker pods...`
      }));

      // Launch async simulated users
      let completed = 0;
      for (let i = 0; i < userCount; i++) {
        const delay = testType === 'burst' ? Math.random() * 800 : (i * (3500 / userCount));

        setTimeout(() => {
          systemState.activeConcurrentRequests++;
          systemState.recentRequestsWindow.push(Date.now());
          updateAutoScaling();

          const user = simulatedUsernames[i % simulatedUsernames.length] + (i >= simulatedUsernames.length ? `_${Math.floor(i / simulatedUsernames.length) + 1}` : '');
          const template = sampleFolderTypes[Math.floor(Math.random() * sampleFolderTypes.length)];
          const folderName = `${template.name}_${Math.floor(100 + Math.random() * 900)}`;
          const assignedPod = assignWorkerPod();

          const willFail = Math.random() * 100 < failureRate;
          const sizeBytes = Math.round(template.sizeMB * 1024 * 1024 * (0.6 + Math.random() * 0.8));

          const folderRecord = {
            id: 'sim_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 4),
            name: folderName,
            username: user,
            fileCount: template.files + Math.floor(Math.random() * 5),
            sizeBytes: sizeBytes,
            sizeFormatted: formatBytes(sizeBytes),
            status: 'PROCESSING',
            uploadedAt: new Date().toISOString(),
            reason: null,
            workerPod: assignedPod.id,
            files: Array.from({ length: Math.min(6, template.files) }).map((_, fIdx) => ({
              name: `${folderName}/subfolder/module_${fIdx + 1}.${willFail && fIdx === 0 ? 'exe' : 'ts'}`,
              size: formatBytes(Math.round(sizeBytes / template.files)),
              path: `${folderName}/module_${fIdx + 1}`
            }))
          };

          broadcastSSE('stress_batch_event', {
            type: 'STARTED',
            user: user,
            folderName: folderName,
            pod: assignedPod.id,
            activeRequests: systemState.activeConcurrentRequests
          });

          const processingTime = 500 + Math.random() * 1200;
          setTimeout(() => {
            systemState.activeConcurrentRequests = Math.max(0, systemState.activeConcurrentRequests - 1);
            systemState.totalUploads++;

            if (willFail) {
              folderRecord.status = 'FAILED';
              folderRecord.reason = failureReasonsPool[Math.floor(Math.random() * failureReasonsPool.length)];
              systemState.failedUploads++;
            } else {
              folderRecord.status = 'SUCCESS';
              systemState.successfulUploads++;
              systemState.totalBytesStored += sizeBytes;
            }

            systemState.folders.unshift(folderRecord);
            if (systemState.folders.length > 200) systemState.folders.pop();

            completed++;
            broadcastSSE('folder_update', { folder: folderRecord, stats: getSystemStats() });
            broadcastSSE('stress_batch_event', {
              type: 'COMPLETED',
              completed,
              total: userCount,
              folder: folderRecord
            });

            updateAutoScaling();
          }, processingTime);

        }, delay);
      }
    });
    return;
  }

  // 5. Real Folder Upload Endpoint
  if (pathname === '/api/upload' && req.method === 'POST') {
    systemState.activeConcurrentRequests++;
    systemState.recentRequestsWindow.push(Date.now());
    updateAutoScaling();

    const assignedPod = assignWorkerPod();
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);

    if (!boundaryMatch) {
      systemState.activeConcurrentRequests = Math.max(0, systemState.activeConcurrentRequests - 1);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'Invalid Content-Type header. Expected multipart/form-data.' }));
    }

    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const chunks = [];

    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const fullBuffer = Buffer.concat(chunks);
      const parts = parseMultipartFormData(fullBuffer, boundary);

      let username = 'guest_user';
      let folderName = 'Uploaded_Folder';
      const fileParts = [];

      parts.forEach(p => {
        if (p.name === 'username') username = p.data.toString('utf-8').trim();
        else if (p.name === 'folderName') folderName = p.data.toString('utf-8').trim();
        else if (p.filename) fileParts.push(p);
      });

      const totalFiles = fileParts.length;
      let totalSize = fileParts.reduce((acc, p) => acc + p.data.length, 0);

      const folderRecord = {
        id: 'fld_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: folderName,
        username: username,
        fileCount: totalFiles,
        sizeBytes: totalSize,
        sizeFormatted: formatBytes(totalSize),
        status: 'PROCESSING',
        uploadedAt: new Date().toISOString(),
        reason: null,
        workerPod: assignedPod.id,
        files: fileParts.map(f => ({
          name: f.filename,
          size: formatBytes(f.data.length),
          path: f.filename
        }))
      };

      // Validation & Policy Checks
      let failureReason = null;

      if (totalFiles === 0) {
        failureReason = 'Empty Folder: No valid files detected in the folder directory.';
      } else {
        // Check Banned Extensions
        const bannedFile = fileParts.find(f => {
          const ext = path.extname(f.filename).toLowerCase();
          return BANNED_EXTENSIONS.includes(ext);
        });

        if (bannedFile) {
          failureReason = `Security Policy Violation: Disallowed executable/script '${path.extname(bannedFile.filename)}' detected in folder file '${bannedFile.filename}'.`;
        }

        // Check User Quota
        const userCfg = USER_CONFIGS[username.toLowerCase()] || { quotaBytes: 80 * 1024 * 1024, usedBytes: 0, maxFilesPerFolder: 200 };
        if (userCfg.usedBytes + totalSize > userCfg.quotaBytes) {
          failureReason = `Storage Quota Exceeded: User '${username}' exceeded maximum quota of ${formatBytes(userCfg.quotaBytes)} (Requested: +${formatBytes(totalSize)}).`;
        }

        // Check Max Files
        if (totalFiles > userCfg.maxFilesPerFolder) {
          failureReason = `File Count Limit Exceeded: Folder contains ${totalFiles} files (Maximum allowed: ${userCfg.maxFilesPerFolder} files).`;
        }
      }

      // Simulated network processing latency
      setTimeout(() => {
        systemState.activeConcurrentRequests = Math.max(0, systemState.activeConcurrentRequests - 1);
        systemState.totalUploads++;

        if (failureReason) {
          folderRecord.status = 'FAILED';
          folderRecord.reason = failureReason;
          systemState.failedUploads++;
        } else {
          folderRecord.status = 'SUCCESS';
          systemState.successfulUploads++;
          systemState.totalBytesStored += totalSize;

          // Save files to disk preserving subdirectories
          const safeUser = username.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
          const safeFolder = folderName.replace(/[^a-zA-Z0-9_\-.]/g, '_');
          
          fileParts.forEach(f => {
            const relPath = f.filename.replace(/\\/g, '/');
            const targetFilePath = path.join(UPLOADS_ROOT, safeUser, safeFolder, relPath);
            const targetDir = path.dirname(targetFilePath);
            try {
              fs.mkdirSync(targetDir, { recursive: true });
              fs.writeFileSync(targetFilePath, f.data);
            } catch (err) {
              console.error('File write error:', err);
            }
          });

          // Update user used bytes
          const key = username.toLowerCase();
          if (USER_CONFIGS[key]) {
            USER_CONFIGS[key].usedBytes += totalSize;
          } else {
            USER_CONFIGS[key] = { quotaBytes: 80 * 1024 * 1024, usedBytes: totalSize, maxFilesPerFolder: 200 };
          }
        }

        systemState.folders.unshift(folderRecord);
        if (systemState.folders.length > 200) systemState.folders.pop();

        broadcastSSE('folder_update', { folder: folderRecord, stats: getSystemStats() });
        updateAutoScaling();

        if (failureReason) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: false,
            message: failureReason,
            folder: folderRecord
          }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            message: 'Folder uploaded and indexed successfully across cloud cluster.',
            folder: folderRecord
          }));
        }
      }, 500 + Math.random() * 400);
    });
    return;
  }

  // 6. Static File Serving
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';
  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Google Cloud Scalable Folder Upload Console Ready!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`✨ Zero External Dependencies - Pure Node.js Cluster`);
  console.log(`====================================================`);
});
