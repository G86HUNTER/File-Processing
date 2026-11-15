import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFileRecordById } from '../services/mockStorage';

export default function FileDetails() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);

  useEffect(() => {
    const found = getFileRecordById(id);
    setRecord(found);
  }, [id]);

  if (!record) {
    return (
      <div style={{ maxWidth: '800px', margin: '3rem auto', textAlign: 'center', fontFamily: "'Google Sans', Roboto, sans-serif" }}>
        <h2>Folder record not found</h2>
        <p style={{ color: '#5f6368', marginTop: '0.5rem' }}>The requested folder metadata could not be located in the cloud cluster index.</p>
        <Link to="/history" style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: '500' }}>
          &larr; Back to History
        </Link>
      </div>
    );
  }

  const isFailed = record.status === 'FAILED';

  return (
    <div style={{ maxWidth: '840px', margin: '2rem auto', padding: '0 20px', fontFamily: "'Google Sans', Roboto, sans-serif" }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/dashboard" style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: '500' }}>
          &larr; Back to Live Dashboard
        </Link>
      </div>

      <div style={{
        background: '#ffffff',
        border: '1px solid #dadce0',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 1px 3px rgba(60,64,67,0.1)'
      }}>
        <div style={{ borderBottom: '1px solid #dadce0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '500', color: '#202124', margin: '0 0 0.25rem 0' }}>
              📁 {record.folderName || record.filename}
            </h1>
            <span style={{
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '700',
              background: isFailed ? '#fce8e6' : '#e6f4ea',
              color: isFailed ? '#d93025' : '#1e8e3e'
            }}>
              {isFailed ? 'FAILED / REJECTED' : 'SUCCESSFUL'}
            </span>
          </div>
          <p style={{ color: '#5f6368', fontSize: '0.875rem', margin: 0 }}>
            Execution telemetry & audit record from Google Cloud storage cluster
          </p>
        </div>

        {/* Rejection Alert if Failed */}
        {isFailed && (
          <div style={{
            background: '#fce8e6',
            borderLeft: '4px solid #d93025',
            padding: '12px 16px',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            color: '#c5221f',
            fontSize: '0.9rem'
          }}>
            <strong>ACTUAL REASON FOR REJECTION:</strong><br />
            {record.failureReason || 'Admission policy check failed.'}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e8eaed' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#5f6368', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Uploader / Tenant User
            </span>
            <span style={{ fontSize: '1rem', fontWeight: '600', color: '#202124' }}>
              👤 {record.username || 'unknown'}
            </span>
          </div>

          <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e8eaed' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#5f6368', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Worker Node / Pod
            </span>
            <span style={{ fontSize: '1rem', fontWeight: '600', color: '#1a73e8', fontFamily: 'monospace' }}>
              {record.workerPod || 'pod-worker-01'}
            </span>
          </div>

          <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e8eaed' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#5f6368', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Total Volume / Size
            </span>
            <span style={{ fontSize: '1rem', fontWeight: '600', color: '#202124' }}>
              {record.originalSize || '0 B'}
            </span>
          </div>

          <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e8eaed' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#5f6368', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Files In Folder
            </span>
            <span style={{ fontSize: '1rem', fontWeight: '600', color: '#202124' }}>
              {record.fileCount || 1} files
            </span>
          </div>

          <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e8eaed' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#5f6368', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Processing Duration
            </span>
            <span style={{ fontSize: '1rem', fontWeight: '600', color: '#1e8e3e' }}>
              {record.processingDuration || '1.1s'}
            </span>
          </div>

          <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e8eaed' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#5f6368', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Timestamp
            </span>
            <span style={{ fontSize: '0.9rem', color: '#5f6368' }}>
              {new Date(record.uploadTimestamp).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Files Tree */}
        {record.files && record.files.length > 0 && (
          <div style={{ background: '#f8f9fa', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e8eaed' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#5f6368', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Files Hierarchy:
            </span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', maxHeight: '160px', overflowY: 'auto' }}>
              {record.files.map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span>📄 {f.name}</span>
                  <span style={{ color: '#5f6368' }}>{f.size}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
