// Local storage key for scalable multi-user folder processing records
const STORAGE_KEY = 'serverless_pipeline_folders';
const METRICS_KEY = 'serverless_pipeline_metrics';

// Default Tenant Quotas
export const USER_QUOTAS = {
  'aryan.gaikwad': { capBytes: 150 * 1024 * 1024, label: '150 MB' },
  'cloud.admin': { capBytes: 1024 * 1024 * 1024, label: '1 GB' },
  'student_rahul': { capBytes: 50 * 1024 * 1024, label: '50 MB' },
  'guest_user': { capBytes: 25 * 1024 * 1024, label: '25 MB' }
};

export const BANNED_EXTENSIONS = ['exe', 'bat', 'cmd', 'vbs', 'msi', 'sh'];

// Helper to format bytes
export function formatBytes(bytes) {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Initial seed data with both Successful and Failed uploads with exact reasons
const INITIAL_DEMO_RECORDS = [
  {
    id: 'fld-101',
    folderName: 'Cloud_Kubernetes_Manifests',
    filename: 'Cloud_Kubernetes_Manifests (24 files)',
    username: 'aryan.gaikwad',
    fileCount: 24,
    sizeBytes: 4.8 * 1024 * 1024,
    originalSize: '4.80 MB',
    status: 'COMPLETED',
    duplicateStatus: 'UNIQUE',
    uploadTimestamp: new Date(Date.now() - 300000).toISOString(),
    workerPod: 'pod-worker-01',
    processingDuration: '1.2s',
    failureReason: null,
    files: [
      { name: 'deployment.yaml', size: '3.4 KB' },
      { name: 'service.yaml', size: '1.2 KB' },
      { name: 'ingress.yaml', size: '2.1 KB' }
    ]
  },
  {
    id: 'fld-102',
    folderName: 'Unauthorized_Software_Bundle',
    filename: 'Unauthorized_Software_Bundle (6 files)',
    username: 'guest_user',
    fileCount: 6,
    sizeBytes: 88.4 * 1024 * 1024,
    originalSize: '88.40 MB',
    status: 'FAILED',
    duplicateStatus: 'FLAGGED',
    uploadTimestamp: new Date(Date.now() - 200000).toISOString(),
    workerPod: 'pod-worker-02',
    processingDuration: '0.4s',
    failureReason: "Storage Quota Exceeded: User 'guest_user' exceeded maximum quota of 25.00 MB (Requested: +88.40 MB).",
    files: []
  },
  {
    id: 'fld-103',
    folderName: 'Malware_Script_Test_Payload',
    filename: 'Malware_Script_Test_Payload (15 files)',
    username: 'student_rahul',
    fileCount: 15,
    sizeBytes: 1.2 * 1024 * 1024,
    originalSize: '1.20 MB',
    status: 'FAILED',
    duplicateStatus: 'REJECTED',
    uploadTimestamp: new Date(Date.now() - 100000).toISOString(),
    workerPod: 'pod-worker-01',
    processingDuration: '0.3s',
    failureReason: "Security Policy Violation: Disallowed executable/script '.exe' found in folder file 'setup_crack.exe'.",
    files: []
  },
  {
    id: 'fld-104',
    folderName: 'Distributed_Database_Shards',
    filename: 'Distributed_Database_Shards (48 files)',
    username: 'cloud.admin',
    fileCount: 48,
    sizeBytes: 32.6 * 1024 * 1024,
    originalSize: '32.60 MB',
    status: 'COMPLETED',
    duplicateStatus: 'UNIQUE',
    uploadTimestamp: new Date(Date.now() - 40000).toISOString(),
    workerPod: 'pod-worker-02',
    processingDuration: '2.4s',
    failureReason: null,
    files: [
      { name: 'shard_01.sql', size: '10.5 MB' },
      { name: 'shard_02.sql', size: '11.1 MB' }
    ]
  }
];

export function getFileRecords() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_RECORDS));
    return INITIAL_DEMO_RECORDS;
  }
  return JSON.parse(data);
}

export const getStoredFiles = getFileRecords;

export function getFileRecordById(id) {
  const records = getFileRecords();
  return records.find(r => r.id === id || String(r.id) === String(id));
}

// Add full folder upload record
export function addFolderRecord({ folderName, username, files, sizeBytes, status, failureReason, workerPod }) {
  const records = getFileRecords();
  const isFailed = status === 'FAILED';

  const newRecord = {
    id: `fld-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    folderName: folderName || 'Uploaded_Folder',
    filename: `${folderName} (${files ? files.length : 0} files)`,
    username: username || 'aryan.gaikwad',
    fileCount: files ? files.length : 0,
    sizeBytes: sizeBytes || 0,
    originalSize: formatBytes(sizeBytes || 0),
    status: isFailed ? 'FAILED' : (status || 'COMPLETED'),
    duplicateStatus: isFailed ? 'REJECTED' : 'UNIQUE',
    uploadTimestamp: new Date().toISOString(),
    workerPod: workerPod || 'pod-worker-01',
    processingDuration: isFailed ? '0.3s' : `${(0.8 + Math.random() * 1.5).toFixed(1)}s`,
    failureReason: isFailed ? failureReason : null,
    files: Array.isArray(files) ? files.map(f => ({
      name: f.name || f.webkitRelativePath || 'file',
      size: formatBytes(f.size || 0)
    })) : []
  };

  records.unshift(newRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return newRecord;
}

// Legacy single file support
export function addFileRecord(file, username = 'aryan.gaikwad') {
  return addFolderRecord({
    folderName: file.name,
    username,
    files: [file],
    sizeBytes: file.size,
    status: 'COMPLETED',
    failureReason: null
  });
}

export function updateFileStatus(id, status, extraData = {}) {
  const records = getFileRecords();
  const index = records.findIndex(r => r.id === id || String(r.id) === String(id));
  
  if (index !== -1) {
    records[index] = {
      ...records[index],
      status,
      ...extraData
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return records[index];
  }
  return null;
}

export function deleteFileRecord(id) {
  const records = getFileRecords();
  const filtered = records.filter(r => r.id !== id && String(r.id) !== String(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
}

export function resetRecordsToDemo() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_RECORDS));
  return INITIAL_DEMO_RECORDS;
}
