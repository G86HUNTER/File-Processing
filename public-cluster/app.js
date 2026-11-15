/**
 * GOOGLE CLOUD PLATFORM - SCALABLE FOLDER STORAGE & CONCURRENCY MONITOR
 * Frontend Client Controller & Real-Time Engine
 */

(function () {
  'use strict';

  // State Management
  let clusterStats = {
    totalUploads: 0,
    successfulUploads: 0,
    failedUploads: 0,
    successRate: '100.0',
    totalBytesStored: 0,
    totalBytesFormatted: '0 B',
    activeConcurrentRequests: 0,
    peakConcurrentRequests: 0,
    currentPods: 2,
    cpuUsage: 14,
    memoryUsage: 28,
    avgLatencyMs: 42,
    requestsPerSecond: 0,
    pods: []
  };

  let foldersList = [];
  let selectedUploadFiles = []; // Array of File objects with webkitRelativePath
  let activeAuditFilter = 'all';
  let chartInstance = null;
  let chartTimeLabels = [];
  let chartConcurrencyData = [];
  let chartPodsData = [];

  // ================= DOM ELEMENTS =================
  const views = {
    dashboardView: document.getElementById('dashboardView'),
    uploadView: document.getElementById('uploadView'),
    auditView: document.getElementById('auditView'),
    stressView: document.getElementById('stressView')
  };

  const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-view]');
  const currentPageTitle = document.getElementById('currentPageTitle');

  // Metric Elements
  const elMetricTotal = document.getElementById('metricTotalUploads');
  const elMetricSuccessRatio = document.getElementById('metricSuccessRatio');
  const elMetricActiveReq = document.getElementById('metricActiveReq');
  const elMetricPeakReq = document.getElementById('metricPeakReq');
  const elMetricFailed = document.getElementById('metricFailedUploads');
  const elMetricFailureRate = document.getElementById('metricFailureRate');
  const elMetricPods = document.getElementById('metricWorkerPods');
  const elMetricStorage = document.getElementById('metricStorageBytes');
  const elMetricLatency = document.getElementById('metricAvgLatency');
  const elFailedBadge = document.getElementById('failedCountBadge');
  const elActivePodsSidebar = document.getElementById('activePodsCount');
  const elPodsStatusBadge = document.getElementById('podsStatusBadge');
  const elLoadBar = document.getElementById('loadBar');

  // Containers
  const podsListContainer = document.getElementById('podsListContainer');
  const dashboardRecentTableBody = document.getElementById('dashboardRecentTableBody');
  const auditTableBody = document.getElementById('auditTableBody');
  const fullTopologyGrid = document.getElementById('fullTopologyGrid');
  const failureAlertBanner = document.getElementById('failureAlertBanner');
  const countAll = document.getElementById('countAll');
  const countSuccess = document.getElementById('countSuccess');
  const countFailed = document.getElementById('countFailed');

  // Upload Form Elements
  const folderUploadForm = document.getElementById('folderUploadForm');
  const usernameInput = document.getElementById('usernameInput');
  const userPresetSelect = document.getElementById('userPresetSelect');
  const folderNameInput = document.getElementById('folderNameInput');
  const folderFileInput = document.getElementById('folderFileInput');
  const dropZone = document.getElementById('dropZone');
  const selectedFolderPanel = document.getElementById('selectedFolderPanel');
  const selectedFolderName = document.getElementById('selectedFolderName');
  const selectedFolderSpecs = document.getElementById('selectedFolderSpecs');
  const fileListPreview = document.getElementById('fileListPreview');
  const clearSelectionBtn = document.getElementById('clearSelectionBtn');
  const uploadProgressBox = document.getElementById('uploadProgressBox');
  const uploadProgressBar = document.getElementById('uploadProgressBar');
  const uploadProgressStatus = document.getElementById('uploadProgressStatus');
  const uploadProgressPct = document.getElementById('uploadProgressPct');
  const startUploadBtn = document.getElementById('startUploadBtn');

  // Stress Test Elements
  const concurrentUsersInput = document.getElementById('concurrentUsersInput');
  const usersValDisplay = document.getElementById('usersValDisplay');
  const trafficPatternSelect = document.getElementById('trafficPatternSelect');
  const failureRateSlider = document.getElementById('failureRateSlider');
  const failureValDisplay = document.getElementById('failureValDisplay');
  const runStressTestBtn = document.getElementById('runStressTestBtn');
  const stopStressTestBtn = document.getElementById('stopStressTestBtn');
  const testMonitorBox = document.getElementById('testMonitorBox');
  const testProgressCounter = document.getElementById('testProgressCounter');
  const testProgressBar = document.getElementById('testProgressBar');
  const liveEventsLog = document.getElementById('liveEventsLog');

  // Modal Elements
  const folderExplorerModal = document.getElementById('folderExplorerModal');
  const modalFolderName = document.getElementById('modalFolderName');
  const modalFolderMeta = document.getElementById('modalFolderMeta');
  const modalStatusCallout = document.getElementById('modalStatusCallout');
  const modalFileTree = document.getElementById('modalFileTree');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const closeModalFooterBtn = document.getElementById('closeModalFooterBtn');

  // Quick Action Buttons
  const quickTestBtn = document.getElementById('quickTestBtn');
  const openUploadBtn = document.getElementById('openUploadBtn');
  const viewAllAuditBtn = document.getElementById('viewAllAuditBtn');
  const resetSystemBtn = document.getElementById('resetSystemBtn');
  const refreshBtn = document.getElementById('refreshBtn');

  // User Quotas
  const USER_QUOTAS = {
    'aryan.gaikwad': { cap: 150 * 1024 * 1024, label: '150 MB' },
    'cloud.admin': { cap: 1024 * 1024 * 1024, label: '1 GB' },
    'student_rahul': { cap: 50 * 1024 * 1024, label: '50 MB' },
    'guest_user': { cap: 25 * 1024 * 1024, label: '25 MB' }
  };

  // ================= INITIALIZATION =================
  function init() {
    setupNavigation();
    setupRealtimeEvents();
    initChart();
    setupUploadHandlers();
    setupStressTestHandlers();
    setupAuditFilters();
    setupModals();
    setupSearch();
    updateTenantQuotaDisplay();

    // Check user preset change
    userPresetSelect.addEventListener('change', function () {
      if (this.value !== 'custom') {
        usernameInput.value = this.value;
      }
      updateTenantQuotaDisplay();
    });

    usernameInput.addEventListener('input', updateTenantQuotaDisplay);

    quickTestBtn.addEventListener('click', () => switchView('stressView'));
    openUploadBtn.addEventListener('click', () => switchView('uploadView'));
    viewAllAuditBtn.addEventListener('click', () => switchView('auditView'));

    resetSystemBtn.addEventListener('click', async () => {
      if (confirm('Reset all cluster metrics and re-seed demo data?')) {
        await fetch('/api/reset', { method: 'POST' });
        showToast('Cluster metrics reset and re-seeded successfully.', 'info');
      }
    });

    refreshBtn.addEventListener('click', () => {
      fetchData();
      showToast('Refreshed cluster telemetry.', 'info');
    });

    const scaleBtn = document.getElementById('scaleOutManualBtn');
    if (scaleBtn) {
      scaleBtn.addEventListener('click', () => {
        showToast('Manual scale-out requested. Cloud Coordinator spinning up new pod...', 'info');
      });
    }
  }

  // ================= VIEW SWITCHING =================
  function setupNavigation() {
    navItems.forEach(item => {
      item.addEventListener('click', function () {
        const viewId = this.dataset.view;
        switchView(viewId);
      });
    });
  }

  function switchView(viewId) {
    if (!views[viewId]) return;

    // Update nav item active states
    navItems.forEach(n => {
      if (n.dataset.view === viewId) n.classList.add('active');
      else n.classList.remove('active');
    });

    // Update visible view
    Object.keys(views).forEach(vKey => {
      if (vKey === viewId) views[vKey].classList.add('active');
      else views[vKey].classList.remove('active');
    });

    // Update Title
    const titles = {
      dashboardView: 'Cluster Overview & Scalability',
      uploadView: 'Upload Folder to Scalable Cloud',
      auditView: 'Folder Audit & Failure Inspector',
      stressView: 'High-Concurrency Scalability Demonstration'
    };
    currentPageTitle.textContent = titles[viewId] || 'Storage Cluster';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ================= REALTIME SSE ENGINE =================
  function setupRealtimeEvents() {
    const evtSource = new EventSource('/api/events');

    evtSource.addEventListener('init', function (e) {
      const data = JSON.parse(e.data);
      if (data.stats) updateStatsDisplay(data.stats);
      if (data.folders) {
        foldersList = data.folders;
        renderAllTables();
      }
    });

    evtSource.addEventListener('system_metrics', function (e) {
      const stats = JSON.parse(e.data);
      updateStatsDisplay(stats);
      appendChartPoint(stats.activeConcurrentRequests, stats.currentPods);
    });

    evtSource.addEventListener('folder_update', function (e) {
      const data = JSON.parse(e.data);
      if (data.stats) updateStatsDisplay(data.stats);
      if (data.folder) {
        // Add or update folder in memory
        const existingIdx = foldersList.findIndex(f => f.id === data.folder.id);
        if (existingIdx >= 0) {
          foldersList[existingIdx] = data.folder;
        } else {
          foldersList.unshift(data.folder);
        }
        renderAllTables();

        // Notification toast for live user upload
        if (data.folder.status === 'SUCCESS') {
          showToast(`✅ Folder "${data.folder.name}" uploaded successfully by ${data.folder.username}`, 'success');
        } else if (data.folder.status === 'FAILED') {
          showToast(`❌ Folder "${data.folder.name}" by ${data.folder.username} REJECTED: ${data.folder.reason}`, 'error');
        }
      }
    });

    evtSource.addEventListener('stress_batch_event', function (e) {
      const evt = JSON.parse(e.data);
      handleStressBatchEvent(evt);
    });

    evtSource.addEventListener('system_reset', function (e) {
      const data = JSON.parse(e.data);
      if (data.stats) updateStatsDisplay(data.stats);
      if (data.folders) {
        foldersList = data.folders;
        renderAllTables();
      }
    });

    evtSource.onerror = function () {
      console.warn('SSE connection temporarily disconnected. Re-establishing in 3s...');
    };
  }

  async function fetchData() {
    try {
      const res = await fetch('/api/folders');
      const data = await res.json();
      if (data.stats) updateStatsDisplay(data.stats);
      if (data.folders) {
        foldersList = data.folders;
        renderAllTables();
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }

  // ================= METRICS DISPLAY UPDATE =================
  function updateStatsDisplay(stats) {
    clusterStats = stats;

    elMetricTotal.textContent = stats.totalUploads;
    elMetricSuccessRatio.textContent = `${stats.successRate}% successful`;
    elMetricActiveReq.textContent = stats.activeConcurrentRequests;
    elMetricPeakReq.textContent = stats.peakConcurrentRequests;
    elMetricFailed.textContent = stats.failedUploads;

    const failPct = stats.totalUploads > 0 ? ((stats.failedUploads / stats.totalUploads) * 100).toFixed(1) : 0;
    elMetricFailureRate.textContent = `${failPct}% fail`;
    elMetricPods.textContent = stats.currentPods;
    elMetricStorage.textContent = stats.totalBytesFormatted;
    elMetricLatency.textContent = `${stats.avgLatencyMs} ms`;

    elFailedBadge.textContent = `${stats.failedUploads} failed`;
    elActivePodsSidebar.textContent = stats.currentPods;
    elPodsStatusBadge.textContent = `${stats.currentPods} Pods Active`;

    // Load bar in sidebar
    const loadPct = Math.min(100, Math.max(10, Math.round((stats.cpuUsage + stats.memoryUsage) / 2)));
    elLoadBar.style.width = `${loadPct}%`;

    renderPodsWidgets(stats.pods || []);
  }

  function renderPodsWidgets(pods) {
    if (!podsListContainer) return;

    // Small widget on dashboard
    podsListContainer.innerHTML = pods.map(pod => `
      <div class="pod-card-item">
        <div class="pod-header-line">
          <div class="pod-name-wrap">
            <span class="material-symbols-outlined" style="font-size: 16px; color: ${pod.status === 'ACTIVE' ? '#1e8e3e' : '#f9ab00'};">dns</span>
            <span>${pod.id}</span>
          </div>
          <span class="pod-badge ${pod.status.toLowerCase()}">${pod.status}</span>
        </div>
        <div class="pod-metrics-row">
          <span>Zone: ${pod.region}</span>
          <span>Load: <strong>${pod.load}%</strong> | ${pod.processedCount || 0} reqs</span>
        </div>
        <div class="pod-progress-track">
          <div class="pod-progress-bar" style="width: ${Math.min(100, pod.load)}%; background-color: ${pod.load > 75 ? '#d93025' : (pod.load > 45 ? '#f9ab00' : '#1a73e8')}"></div>
        </div>
      </div>
    `).join('');

    // Full topology grid
    if (fullTopologyGrid) {
      fullTopologyGrid.innerHTML = pods.map(pod => `
        <div class="full-pod-card">
          <div class="full-pod-top">
            <span class="full-pod-title">${pod.id}</span>
            <span class="pod-badge ${pod.status.toLowerCase()}">${pod.status}</span>
          </div>
          <div class="pod-stat-line">
            <span>Availability Zone</span>
            <strong>${pod.region}</strong>
          </div>
          <div class="pod-stat-line">
            <span>Worker Load</span>
            <strong>${pod.load}%</strong>
          </div>
          <div class="pod-stat-line">
            <span>Total Requests Ingested</span>
            <strong>${pod.processedCount || 0}</strong>
          </div>
          <div class="pod-progress-track" style="margin-top: 8px;">
            <div class="pod-progress-bar" style="width: ${Math.min(100, pod.load)}%;"></div>
          </div>
        </div>
      `).join('');
    }
  }

  // ================= TABLE RENDERING =================
  function renderAllTables() {
    renderRecentDashboardTable();
    renderAuditTable();
    updateFilterCounts();
  }

  function renderRecentDashboardTable() {
    if (!dashboardRecentTableBody) return;
    const recent = foldersList.slice(0, 7);

    if (recent.length === 0) {
      dashboardRecentTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 24px; color: #80868b;">No recent folder upload events. Upload a folder or run a stress test!</td></tr>`;
      return;
    }

    dashboardRecentTableBody.innerHTML = recent.map(folder => createTableRowHTML(folder)).join('');
    attachTableClickEvents(dashboardRecentTableBody);
  }

  function renderAuditTable() {
    if (!auditTableBody) return;

    const searchTerm = (document.getElementById('auditSearchInput').value || '').trim().toLowerCase();

    let filtered = foldersList.filter(folder => {
      if (activeAuditFilter !== 'all' && folder.status !== activeAuditFilter) return false;
      if (searchTerm) {
        const str = `${folder.name} ${folder.username} ${folder.reason || ''} ${folder.workerPod || ''}`.toLowerCase();
        if (!str.includes(searchTerm)) return false;
      }
      return true;
    });

    // Check failed items banner
    const hasFailures = foldersList.some(f => f.status === 'FAILED');
    if (failureAlertBanner) {
      failureAlertBanner.style.display = hasFailures ? 'flex' : 'none';
    }

    if (filtered.length === 0) {
      auditTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 32px; color: #80868b;">No folders matching current criteria.</td></tr>`;
      document.getElementById('paginationInfo').textContent = `Showing 0 of ${foldersList.length} total`;
      return;
    }

    auditTableBody.innerHTML = filtered.map(folder => createTableRowHTML(folder, true)).join('');
    document.getElementById('paginationInfo').textContent = `Showing 1-${filtered.length} of ${foldersList.length} records`;
    attachTableClickEvents(auditTableBody);
  }

  function createTableRowHTML(folder, showAction = false) {
    const isFailed = folder.status === 'FAILED';
    const isSuccess = folder.status === 'SUCCESS';
    const rowClass = isFailed ? 'row-failed' : '';

    let statusChip = '';
    if (isSuccess) {
      statusChip = `<span class="status-chip success"><span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> SUCCESS</span>`;
    } else if (isFailed) {
      statusChip = `<span class="status-chip failed"><span class="material-symbols-outlined" style="font-size: 14px;">cancel</span> FAILED</span>`;
    } else {
      statusChip = `<span class="status-chip processing"><span class="material-symbols-outlined" style="font-size: 14px;">sync</span> PROCESSING</span>`;
    }

    let outcomeHTML = '';
    if (isFailed) {
      outcomeHTML = `
        <div class="reason-callout" title="${escapeHtml(folder.reason || 'Rejected by policy')}">
          <span class="material-symbols-outlined">warning</span>
          <span><strong>REJECTED:</strong> ${escapeHtml(folder.reason || 'Failure')}</span>
        </div>
      `;
    } else {
      outcomeHTML = `<span style="color: #1e8e3e; font-weight: 500;">✓ Ingested & Indexed in Cluster</span>`;
    }

    const timeStr = formatTime(folder.uploadedAt);

    return `
      <tr class="${rowClass}">
        <td>${statusChip}</td>
        <td>
          <div class="folder-cell">
            <span class="material-symbols-outlined">${isFailed ? 'folder_off' : 'folder'}</span>
            <span style="font-family: 'Google Sans', sans-serif;">${escapeHtml(folder.name)}</span>
          </div>
        </td>
        <td>
          <span class="user-tag ${folder.username.includes('admin') ? 'admin' : ''}">
            <span class="material-symbols-outlined" style="font-size: 14px;">person</span>
            ${escapeHtml(folder.username)}
          </span>
        </td>
        <td>${folder.fileCount} files</td>
        <td>${folder.sizeFormatted || '0 B'}</td>
        <td><span class="pod-code">${folder.workerPod || 'pod-01'}</span></td>
        <td style="color: #5f6368; font-size: 12px;">${timeStr}</td>
        <td>${outcomeHTML}</td>
        ${showAction ? `
          <td style="text-align: right;">
            <button class="gcp-btn gcp-btn-secondary btn-sm explore-folder-btn" data-folder-id="${folder.id}">
              <span class="material-symbols-outlined" style="font-size: 14px;">info</span>
              Inspect
            </button>
          </td>
        ` : ''}
      </tr>
    `;
  }

  function attachTableClickEvents(container) {
    const btns = container.querySelectorAll('.explore-folder-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const folderId = btn.dataset.folderId;
        const folder = foldersList.find(f => f.id === folderId);
        if (folder) openFolderModal(folder);
      });
    });
  }

  function updateFilterCounts() {
    const total = foldersList.length;
    const success = foldersList.filter(f => f.status === 'SUCCESS').length;
    const failed = foldersList.filter(f => f.status === 'FAILED').length;

    if (countAll) countAll.textContent = total;
    if (countSuccess) countSuccess.textContent = success;
    if (countFailed) countFailed.textContent = failed;
  }

  function setupAuditFilters() {
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', function () {
        filterChips.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        activeAuditFilter = this.dataset.filter;
        renderAuditTable();
      });
    });

    document.getElementById('auditSearchInput').addEventListener('input', () => {
      renderAuditTable();
    });
  }

  // ================= UPLOAD ENGINE =================
  function setupUploadHandlers() {
    // 1. Directory Input picker
    folderFileInput.addEventListener('change', function (e) {
      if (e.target.files && e.target.files.length > 0) {
        handleFilesSelected(Array.from(e.target.files));
      }
    });

    // 2. Drag & drop on zone
    dropZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', function () {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', async function (e) {
      e.preventDefault();
      dropZone.classList.remove('dragover');

      const items = e.dataTransfer.items;
      if (items && items.length > 0) {
        const fileList = await scanFilesFromDataTransfer(items);
        if (fileList.length > 0) {
          handleFilesSelected(fileList);
        }
      } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFilesSelected(Array.from(e.dataTransfer.files));
      }
    });

    // 3. Clear button
    clearSelectionBtn.addEventListener('click', () => {
      resetUploadSelection();
    });

    // 4. Form submit
    folderUploadForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (selectedUploadFiles.length === 0) {
        showToast('Please select or drop a folder first.', 'error');
        return;
      }

      await executeFolderUpload();
    });
  }

  // Recursive directory reader for Drag and Drop
  async function scanFilesFromDataTransfer(items) {
    const files = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          await traverseFileTree(entry, '', files);
        }
      }
    }

    return files;
  }

  function traverseFileTree(item, path, fileList) {
    return new Promise((resolve) => {
      path = path || '';
      if (item.isFile) {
        item.file((file) => {
          // preserve relative path
          file.customRelativePath = path + file.name;
          fileList.push(file);
          resolve();
        }, () => resolve());
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        const readEntries = () => {
          dirReader.readEntries(async (entries) => {
            if (entries.length === 0) {
              resolve();
            } else {
              for (const entry of entries) {
                await traverseFileTree(entry, path + item.name + '/', fileList);
              }
              readEntries();
            }
          }, () => resolve());
        };
        readEntries();
      } else {
        resolve();
      }
    });
  }

  function handleFilesSelected(files) {
    selectedUploadFiles = files;

    // Detect Root Folder Name
    let detectedFolderName = 'My_Folder';
    const firstRel = files[0].webkitRelativePath || files[0].customRelativePath || '';
    if (firstRel && firstRel.includes('/')) {
      detectedFolderName = firstRel.split('/')[0];
    }

    folderNameInput.value = detectedFolderName;
    selectedFolderName.textContent = detectedFolderName;

    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    selectedFolderSpecs.textContent = `${files.length} files (${formatBytes(totalBytes)})`;

    // Preview up to 5 files
    fileListPreview.innerHTML = files.slice(0, 6).map(f => {
      const rel = f.webkitRelativePath || f.customRelativePath || f.name;
      return `<div class="preview-file-line"><span>📁 ${escapeHtml(rel)}</span><span>${formatBytes(f.size)}</span></div>`;
    }).join('') + (files.length > 6 ? `<div style="padding-top: 4px; color: #80868b;">...and ${files.length - 6} more files</div>` : '');

    selectedFolderPanel.style.display = 'block';
  }

  function resetUploadSelection() {
    selectedUploadFiles = [];
    folderFileInput.value = '';
    selectedFolderPanel.style.display = 'none';
    uploadProgressBox.style.display = 'none';
    startUploadBtn.disabled = false;
  }

  async function executeFolderUpload() {
    startUploadBtn.disabled = true;
    uploadProgressBox.style.display = 'block';
    uploadProgressBar.style.width = '15%';
    uploadProgressPct.textContent = '15%';
    uploadProgressStatus.textContent = 'Preparing files & establishing stream to cloud worker pod...';

    const formData = new FormData();
    const username = usernameInput.value.trim() || 'aryan.gaikwad';
    const folderName = folderNameInput.value.trim() || selectedFolderName.textContent;

    formData.append('username', username);
    formData.append('folderName', folderName);

    selectedUploadFiles.forEach(file => {
      // Pass original relative path if available
      const relPath = file.webkitRelativePath || file.customRelativePath || file.name;
      formData.append('files', file, relPath);
    });

    try {
      uploadProgressBar.style.width = '65%';
      uploadProgressPct.textContent = '65%';
      uploadProgressStatus.textContent = 'Streaming multi-tenant chunks through Cloud Load Balancer...';

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      uploadProgressBar.style.width = '100%';
      uploadProgressPct.textContent = '100%';

      const data = await res.json();

      if (res.ok && data.success) {
        uploadProgressStatus.textContent = 'Upload Completed & Indexed Successfully!';
        showToast(`🎉 Success: Folder "${folderName}" accepted by Cloud Storage.`, 'success');
        setTimeout(() => {
          resetUploadSelection();
          switchView('auditView');
        }, 1200);
      } else {
        uploadProgressStatus.textContent = `Rejected: ${data.message || 'Validation failed'}`;
        showToast(`⚠️ Folder Rejected: ${data.message}`, 'error');
        startUploadBtn.disabled = false;
      }
    } catch (err) {
      uploadProgressStatus.textContent = `Network / Cluster Error: ${err.message}`;
      showToast(`Error connecting to server: ${err.message}`, 'error');
      startUploadBtn.disabled = false;
    }
  }

  function updateTenantQuotaDisplay() {
    const uname = (usernameInput.value || 'aryan.gaikwad').trim().toLowerCase();
    document.getElementById('activeTenantName').textContent = uname;

    const userCfg = USER_QUOTAS[uname] || { cap: 80 * 1024 * 1024, label: '80 MB' };
    
    // Calculate total used by this user from foldersList
    const userUsed = foldersList
      .filter(f => f.username.toLowerCase() === uname && f.status === 'SUCCESS')
      .reduce((acc, f) => acc + (f.sizeBytes || 0), 0);

    const pct = Math.min(100, Math.round((userUsed / userCfg.cap) * 100));
    document.getElementById('userQuotaBar').style.width = `${pct}%`;
    document.getElementById('userQuotaText').textContent = `${formatBytes(userUsed)} of ${userCfg.label} used`;
  }

  // ================= SCALABILITY STRESS TEST ENGINE (FOR SIR) =================
  function setupStressTestHandlers() {
    concurrentUsersInput.addEventListener('input', function () {
      usersValDisplay.textContent = `${this.value} users`;
    });

    failureRateSlider.addEventListener('input', function () {
      failureValDisplay.textContent = `${this.value}%`;
    });

    runStressTestBtn.addEventListener('click', async function () {
      const userCount = parseInt(concurrentUsersInput.value, 10);
      const failureRate = parseInt(failureRateSlider.value, 10);
      const testType = trafficPatternSelect.value;

      runStressTestBtn.disabled = true;
      stopStressTestBtn.disabled = false;
      testMonitorBox.style.display = 'block';
      testProgressBar.style.width = '5%';
      testProgressCounter.textContent = `0 / ${userCount} users completed`;
      liveEventsLog.innerHTML = `<div class="log-entry-pod">[INIT] Starting Scalability Stress Test: ${userCount} Concurrent Users | Injected Failure Rate: ${failureRate}%</div>`;

      try {
        const res = await fetch('/api/simulate-stress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userCount, failureRate, testType })
        });
        const data = await res.json();
        showToast(data.message, 'info');
      } catch (err) {
        showToast(`Failed to trigger simulation: ${err.message}`, 'error');
        runStressTestBtn.disabled = false;
      }
    });

    stopStressTestBtn.addEventListener('click', function () {
      stopStressTestBtn.disabled = true;
      runStressTestBtn.disabled = false;
      showToast('Simulation stopping...', 'info');
    });
  }

  function handleStressBatchEvent(evt) {
    if (evt.type === 'STARTED') {
      appendLiveLog(`[${evt.pod}] User '${evt.user}' initiated folder stream: "${evt.folderName}" (Active Cluster Concurrency: ${evt.activeRequests})`, 'normal');
    } else if (evt.type === 'COMPLETED') {
      const f = evt.folder;
      const pct = Math.round((evt.completed / evt.total) * 100);
      testProgressBar.style.width = `${pct}%`;
      testProgressCounter.textContent = `${evt.completed} / ${evt.total} users completed (${pct}%)`;

      if (f.status === 'SUCCESS') {
        appendLiveLog(`[${f.workerPod}] ✅ User '${f.username}' uploaded folder "${f.name}" (${f.fileCount} files, ${f.sizeFormatted}) - SUCCESS`, 'success');
      } else {
        appendLiveLog(`[${f.workerPod}] ❌ User '${f.username}' FAILED: "${f.name}" -> Reason: ${f.reason}`, 'fail');
      }

      if (evt.completed >= evt.total) {
        appendLiveLog(`[DONE] All ${evt.total} concurrent user uploads completed. Autoscaler cooling down.`, 'pod');
        runStressTestBtn.disabled = false;
        stopStressTestBtn.disabled = true;
        showToast(`🎉 Scalability Stress Test Complete: Ingested ${evt.total} concurrent folders.`, 'success');
      }
    }
  }

  function appendLiveLog(msg, type = 'normal') {
    if (!liveEventsLog) return;
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    if (type === 'fail') div.className = 'log-entry-fail';
    else if (type === 'pod') div.className = 'log-entry-pod';
    div.textContent = `[${time}] ${msg}`;
    liveEventsLog.appendChild(div);
    liveEventsLog.scrollTop = liveEventsLog.scrollHeight;
  }

  // ================= MODAL & DETAILS =================
  function setupModals() {
    closeModalBtn.addEventListener('click', closeModal);
    closeModalFooterBtn.addEventListener('click', closeModal);
    folderExplorerModal.addEventListener('click', (e) => {
      if (e.target === folderExplorerModal) closeModal();
    });
  }

  function openFolderModal(folder) {
    modalFolderName.textContent = folder.name;
    modalFolderMeta.textContent = `Tenant: ${folder.username} | Worker Pod: ${folder.workerPod} | Time: ${formatTime(folder.uploadedAt)}`;

    if (folder.status === 'FAILED') {
      modalStatusCallout.innerHTML = `
        <div class="reason-callout" style="width: 100%; max-width: none; font-size: 13px;">
          <span class="material-symbols-outlined">error</span>
          <div>
            <strong>UPLOAD REJECTED BY CLUSTER ADMISSION POLICY:</strong><br>
            ${escapeHtml(folder.reason || 'Unknown reason')}
          </div>
        </div>
      `;
    } else {
      modalStatusCallout.innerHTML = `
        <div style="background: #e6f4ea; color: #137333; padding: 10px 14px; border-radius: 6px; font-size: 13px; font-weight: 500;">
          ✓ Fully Ingested & Replicated across Google Cloud availability zones (${folder.sizeFormatted}).
        </div>
      `;
    }

    const files = folder.files || [];
    if (files.length === 0) {
      modalFileTree.innerHTML = `<div style="color: #80868b; text-align: center; padding: 12px;">No file trees available for rejected or empty upload.</div>`;
    } else {
      modalFileTree.innerHTML = files.map(file => `
        <div class="tree-item">
          <div class="tree-file-left">
            <span class="material-symbols-outlined">description</span>
            <span>${escapeHtml(file.name || file.path)}</span>
          </div>
          <span style="color: #5f6368;">${file.size || ''}</span>
        </div>
      `).join('');
    }

    folderExplorerModal.style.display = 'flex';
  }

  function closeModal() {
    folderExplorerModal.style.display = 'none';
  }

  // ================= CHART.JS CONCURRENCY GRAPH =================
  function initChart() {
    const ctx = document.getElementById('concurrencyChart');
    if (!ctx) return;

    // Generate initial time labels
    const now = Date.now();
    for (let i = 12; i >= 0; i--) {
      chartTimeLabels.push(new Date(now - i * 2000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      chartConcurrencyData.push(Math.floor(Math.random() * 2));
      chartPodsData.push(2);
    }

    const canvasCtx = ctx.getContext('2d');
    const blueGradient = canvasCtx.createLinearGradient(0, 0, 0, 220);
    blueGradient.addColorStop(0, 'rgba(26, 115, 232, 0.35)');
    blueGradient.addColorStop(1, 'rgba(26, 115, 232, 0.00)');

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartTimeLabels,
        datasets: [
          {
            label: 'Concurrent Requests',
            data: chartConcurrencyData,
            borderColor: '#1a73e8',
            backgroundColor: blueGradient,
            fill: true,
            tension: 0.35,
            borderWidth: 2.5,
            pointRadius: 2,
            pointHoverRadius: 5
          },
          {
            label: 'Auto-scaled Pods',
            data: chartPodsData,
            borderColor: '#f9ab00',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.2,
            borderWidth: 2,
            pointRadius: 2,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Google Sans', size: 12 } } },
          tooltip: {
            backgroundColor: '#202124',
            titleFont: { family: 'Google Sans' }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: {
            beginAtZero: true,
            suggestedMax: 10,
            title: { display: true, text: 'Requests / Sec', font: { size: 11 } },
            grid: { color: '#f1f3f4' }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            suggestedMax: 10,
            title: { display: true, text: 'Pods Count', font: { size: 11 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  function appendChartPoint(concurrency, podsCount) {
    if (!chartInstance) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    chartTimeLabels.push(time);
    chartConcurrencyData.push(concurrency);
    chartPodsData.push(podsCount);

    if (chartTimeLabels.length > 20) {
      chartTimeLabels.shift();
      chartConcurrencyData.shift();
      chartPodsData.shift();
    }

    chartInstance.update('none');
  }

  // ================= UTILITIES & HELPERS =================
  function setupSearch() {
    const globalSearch = document.getElementById('globalSearchInput');
    if (globalSearch) {
      globalSearch.addEventListener('input', (e) => {
        const val = e.target.value;
        document.getElementById('auditSearchInput').value = val;
        switchView('auditView');
        renderAuditTable();
      });
    }

    // Keyboard shortcut '/'
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        if (globalSearch) globalSearch.focus();
      }
    });
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `gcp-toast toast-${type}`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    if (type === 'error') icon = 'error';

    toast.innerHTML = `
      <span class="material-symbols-outlined" style="font-size: 18px;">${icon}</span>
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s';
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  function formatBytes(bytes) {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatTime(isoStr) {
    if (!isoStr) return '--';
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + d.toLocaleDateString() + ')';
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Start app
  document.addEventListener('DOMContentLoaded', init);

})();
