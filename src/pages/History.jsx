import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFileRecords, deleteFileRecord } from '../services/mockStorage';

export default function History() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    try {
      const data = getFileRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load records:", e);
      setRecords([]);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this folder record?")) {
      deleteFileRecord(id);
      loadRecords();
    }
  };

  const filtered = records.filter(r => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (r.folderName || r.filename || '').toLowerCase().includes(q) ||
           (r.username || '').toLowerCase().includes(q) ||
           (r.failureReason || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px', fontFamily: "'Google Sans', Roboto, sans-serif" }}>
      
      {/* Header */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #dadce0',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(60,64,67,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '500', color: '#202124', margin: '0 0 4px 0' }}>
            Historical Folder Ingestion Logs & Cloud Audit
          </h1>
          <p style={{ color: '#5f6368', fontSize: '0.85rem', margin: 0 }}>
            Permanent audit trail tracking all user names, folder uploads, and actual rejection reasons.
          </p>
        </div>

        <input
          type="text"
          placeholder="Filter logs by user, folder, or reason..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            height: '36px',
            padding: '0 14px',
            border: '1px solid #dadce0',
            borderRadius: '6px',
            fontSize: '0.85rem',
            width: '260px',
            outline: 'none'
          }}
        />
      </div>

      {/* History Table */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #dadce0',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(60,64,67,0.1)'
      }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#5f6368' }}>
            <p>No folder records match your criteria.</p>
            <Link to="/" style={{ color: '#1a73e8', fontWeight: '500', textDecoration: 'none' }}>
              Go to Upload Folder →
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #dadce0', color: '#5f6368', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Folder Name</th>
                  <th style={{ padding: '10px 12px' }}>User Name</th>
                  <th style={{ padding: '10px 12px' }}>Size</th>
                  <th style={{ padding: '10px 12px' }}>Worker Pod</th>
                  <th style={{ padding: '10px 12px' }}>Upload Time</th>
                  <th style={{ padding: '10px 12px' }}>Audit Reason / Result</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => {
                  const isFailed = record.status === 'FAILED';
                  return (
                    <tr key={record.id} style={{ borderBottom: '1px solid #e8eaed', background: isFailed ? '#fff8f7' : 'transparent' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          background: isFailed ? '#fce8e6' : '#e6f4ea',
                          color: isFailed ? '#d93025' : '#1e8e3e'
                        }}>
                          {isFailed ? 'FAILED' : 'SUCCESS'}
                        </span>
                      </td>

                      <td style={{ padding: '10px 12px', fontWeight: '500', color: '#202124' }}>
                        📁 {record.folderName || record.filename}
                      </td>

                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: '#f1f3f4', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.78rem' }}>
                          👤 {record.username || 'user'}
                        </span>
                      </td>

                      <td style={{ padding: '10px 12px', color: '#5f6368' }}>
                        {record.originalSize || '0 MB'}
                      </td>

                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#5f6368' }}>
                        {record.workerPod || 'pod-01'}
                      </td>

                      <td style={{ padding: '10px 12px', color: '#5f6368', fontSize: '0.75rem' }}>
                        {new Date(record.uploadTimestamp).toLocaleString()}
                      </td>

                      <td style={{ padding: '10px 12px' }}>
                        {isFailed ? (
                          <span style={{ color: '#c5221f', fontSize: '0.8rem', fontWeight: '500' }}>
                            {record.failureReason}
                          </span>
                        ) : (
                          <span style={{ color: '#1e8e3e', fontSize: '0.8rem' }}>
                            ✓ Ingested & replicated
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDelete(record.id)}
                          style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            border: 'none',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
