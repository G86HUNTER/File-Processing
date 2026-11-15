import React, { useState } from 'react';
import { USER_QUOTAS, BANNED_EXTENSIONS, formatBytes } from '../services/mockStorage';

export default function FileUpload({ onFolderSelect, onFileSelect }) {
  const [uploadMode, setUploadMode] = useState('folder'); // 'folder' | 'single'
  const [username, setUsername] = useState('aryan.gaikwad');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [filesList, setFilesList] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [folderName, setFolderName] = useState('');

  const handleFolderChange = (e) => {
    const files = Array.from(e.target.files || []);
    setValidationError('');

    if (files.length === 0) {
      setSelectedFolder(null);
      setFilesList([]);
      return;
    }

    // Determine root folder name from relative path
    let rootName = 'My_Folder';
    const firstRel = files[0].webkitRelativePath || '';
    if (firstRel.includes('/')) {
      rootName = firstRel.split('/')[0];
    } else {
      rootName = files[0].name.split('.')[0] + '_Folder';
    }

    setFolderName(rootName);

    // Calculate total size
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);

    // Admission / Policy Checks
    const userCfg = USER_QUOTAS[username.toLowerCase()] || { capBytes: 80 * 1024 * 1024, label: '80 MB' };
    
    // Check 1: Storage Quota
    if (totalSize > userCfg.capBytes) {
      const err = `Storage Quota Exceeded: User '${username}' exceeded maximum quota of ${userCfg.label} (Requested: ${formatBytes(totalSize)}).`;
      setValidationError(err);
      setSelectedFolder({ name: rootName, files, totalSize, isFailed: true, reason: err });
      if (onFolderSelect) onFolderSelect({ name: rootName, files, totalSize, username, isFailed: true, reason: err });
      return;
    }

    // Check 2: Banned Executables
    const bannedFile = files.find(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      return BANNED_EXTENSIONS.includes(ext);
    });

    if (bannedFile) {
      const ext = bannedFile.name.split('.').pop();
      const err = `Security Policy Violation: Disallowed executable/script '.${ext}' found in file '${bannedFile.name}'.`;
      setValidationError(err);
      setSelectedFolder({ name: rootName, files, totalSize, isFailed: true, reason: err });
      if (onFolderSelect) onFolderSelect({ name: rootName, files, totalSize, username, isFailed: true, reason: err });
      return;
    }

    // Valid Folder
    setFilesList(files);
    setSelectedFolder({ name: rootName, files, totalSize, isFailed: false, reason: null });
    if (onFolderSelect) onFolderSelect({ name: rootName, files, totalSize, username, isFailed: false, reason: null });
  };

  const handleRemove = () => {
    setSelectedFolder(null);
    setFilesList([]);
    setValidationError('');
    if (onFolderSelect) onFolderSelect(null);
    if (onFileSelect) onFileSelect(null);
  };

  const currentQuota = USER_QUOTAS[username.toLowerCase()] || { label: '80 MB' };

  return (
    <div style={{ background: '#ffffff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #dadce0', boxShadow: '0 1px 3px rgba(60,64,67,0.1)' }}>
      
      {/* User / Tenant Selector */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#202124', marginBottom: '0.4rem' }}>
          User Name / Tenant Identity <span style={{ color: '#d93025' }}>*</span>
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. aryan.gaikwad"
            style={{
              flex: 1,
              height: '38px',
              padding: '0 10px',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <select
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              height: '38px',
              padding: '0 10px',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              background: '#f8f9fa',
              fontSize: '0.85rem'
            }}
          >
            <option value="aryan.gaikwad">aryan.gaikwad (150 MB Quota)</option>
            <option value="cloud.admin">cloud.admin (1 GB Quota)</option>
            <option value="student_rahul">student_rahul (50 MB Quota)</option>
            <option value="guest_user">guest_user (Strict 25 MB Quota)</option>
          </select>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#5f6368', marginTop: '4px', display: 'block' }}>
          Every folder is tagged with the user name. Quota allocated: <strong>{currentQuota.label}</strong>.
        </span>
      </div>

      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', background: '#f1f3f4', padding: '4px', borderRadius: '6px', width: 'fit-content' }}>
        <button
          type="button"
          onClick={() => { setUploadMode('folder'); handleRemove(); }}
          style={{
            border: 'none',
            background: uploadMode === 'folder' ? '#1a73e8' : 'transparent',
            color: uploadMode === 'folder' ? '#ffffff' : '#5f6368',
            padding: '6px 14px',
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📁 Upload Entire Folder
        </button>
        <button
          type="button"
          onClick={() => { setUploadMode('single'); handleRemove(); }}
          style={{
            border: 'none',
            background: uploadMode === 'single' ? '#1a73e8' : 'transparent',
            color: uploadMode === 'single' ? '#ffffff' : '#5f6368',
            padding: '6px 14px',
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📄 Single File
        </button>
      </div>

      {/* Drop / Browse Area */}
      <div
        onClick={() => document.getElementById('cloud-input-element').click()}
        style={{
          border: '2px dashed #4285f4',
          borderRadius: '10px',
          padding: '2.5rem 1rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: '#f8fbff',
          transition: 'all 0.2s ease'
        }}
      >
        {uploadMode === 'folder' ? (
          <input
            type="file"
            id="cloud-input-element"
            webkitdirectory="true"
            directory="true"
            multiple
            onChange={handleFolderChange}
            style={{ display: 'none' }}
          />
        ) : (
          <input
            type="file"
            id="cloud-input-element"
            onChange={handleFolderChange}
            style={{ display: 'none' }}
          />
        )}

        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          {uploadMode === 'folder' ? '📂' : '📄'}
        </div>
        <p style={{ fontWeight: '600', color: '#1a73e8', fontSize: '1rem', marginBottom: '0.3rem' }}>
          {uploadMode === 'folder' ? 'Click to Browse & Select an Entire Folder' : 'Click to Select a File'}
        </p>
        <p style={{ fontSize: '0.82rem', color: '#5f6368', margin: 0 }}>
          {uploadMode === 'folder' 
            ? 'Supports recursive subdirectories, datasets, and code trees (Auto-validated)'
            : 'Supports images, documents, CSV, and code files'}
        </p>
      </div>

      {/* Selected Folder / Files Summary */}
      {selectedFolder && (
        <div style={{
          marginTop: '1rem',
          padding: '12px',
          background: selectedFolder.isFailed ? '#fce8e6' : '#e6f4ea',
          border: `1px solid ${selectedFolder.isFailed ? '#fad2cf' : '#ceead6'}`,
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{ fontWeight: '600', color: selectedFolder.isFailed ? '#c5221f' : '#137333', margin: 0, fontSize: '0.95rem' }}>
              {selectedFolder.isFailed ? '⚠️ Folder Admission Rejected' : '✓ Folder Ready for Ingestion'} : {selectedFolder.name}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#5f6368', margin: '2px 0 0 0' }}>
              {selectedFolder.files ? selectedFolder.files.length : 0} files ({formatBytes(selectedFolder.totalSize)}) | User: <strong>{username}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#d93025',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Remove
          </button>
        </div>
      )}

      {/* Validation Error / Reason Message */}
      {validationError && (
        <div style={{
          marginTop: '0.75rem',
          padding: '10px 14px',
          background: '#fce8e6',
          borderLeft: '4px solid #d93025',
          borderRadius: '4px',
          color: '#c5221f',
          fontSize: '0.85rem',
          lineHeight: '1.4'
        }}>
          <strong>REJECTION REASON:</strong> {validationError}
        </div>
      )}

    </div>
  );
}
