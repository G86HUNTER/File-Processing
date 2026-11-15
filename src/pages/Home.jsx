import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import StatusCard from '../components/StatusCard';
import { addFolderRecord } from '../services/mockStorage';

export default function Home() {
  const navigate = useNavigate();
  const [selectedFolderData, setSelectedFolderData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const handleFolderSelect = (data) => {
    setSelectedFolderData(data);
    setCurrentRecord(null);
    setUploadError(data && data.isFailed ? data.reason : '');
  };

  const handleUpload = async () => {
    if (!selectedFolderData) return;

    setIsProcessing(true);
    setUploadError('');

    // If validation failed prior to upload (e.g. quota or banned file)
    if (selectedFolderData.isFailed) {
      const record = addFolderRecord({
        folderName: selectedFolderData.name,
        username: selectedFolderData.username,
        files: selectedFolderData.files,
        sizeBytes: selectedFolderData.totalSize,
        status: 'FAILED',
        failureReason: selectedFolderData.reason,
        workerPod: 'pod-worker-01'
      });

      setCurrentRecord(record);
      setUploadError(selectedFolderData.reason);
      setIsProcessing(false);
      return;
    }

    // Assign worker pod
    const podNum = Math.floor(Math.random() * 2) + 1;
    const workerPod = `pod-worker-0${podNum}`;

    // Simulate multi-tier cloud ingestion (Load balancer -> Worker -> S3/DynamoDB)
    setTimeout(() => {
      const record = addFolderRecord({
        folderName: selectedFolderData.name,
        username: selectedFolderData.username,
        files: selectedFolderData.files,
        sizeBytes: selectedFolderData.totalSize,
        status: 'COMPLETED',
        failureReason: null,
        workerPod: workerPod
      });

      setCurrentRecord(record);
      setIsProcessing(false);

      // Auto redirect to dashboard after 1.8 seconds to see live link
      setTimeout(() => {
        navigate('/dashboard');
      }, 1800);
    }, 1200);
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '36px 20px', fontFamily: "'Google Sans', Roboto, sans-serif" }}>
      
      {/* Hero Header */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #dadce0',
        borderRadius: '12px',
        padding: '24px 28px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(60,64,67,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{
            background: '#e8f0fe',
            color: '#1a73e8',
            fontSize: '11px',
            fontWeight: '700',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            CLOUD COMPUTING COURSE PROJECT (CC CP)
          </span>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '500', color: '#202124', margin: '0 0 6px 0' }}>
          Scalable Cloud Folder Ingestion Engine
        </h1>
        <p style={{ color: '#5f6368', fontSize: '0.92rem', margin: 0, lineHeight: '1.5' }}>
          Upload any directory or folder to demonstrate real-time multi-tenant scalability, load balancing, and failure isolation on our live Google Cloud dashboard.
        </p>
      </div>

      {/* Upload Box Component */}
      <FileUpload onFolderSelect={handleFolderSelect} />

      {uploadError && (
        <div style={{
          marginTop: '1rem',
          padding: '12px 16px',
          background: '#fce8e6',
          borderLeft: '4px solid #d93025',
          borderRadius: '4px',
          color: '#c5221f',
          fontSize: '0.88rem'
        }}>
          <strong>REJECTION LOG:</strong> {uploadError}
        </div>
      )}

      {/* Action Button */}
      {selectedFolderData && !isProcessing && (
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={handleUpload}
            style={{
              background: '#1a73e8',
              color: '#ffffff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '6px',
              fontSize: '0.92rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 2px rgba(60,64,67,0.3)'
            }}
          >
            🚀 Ingest Folder to Cloud Cluster & View on Dashboard
          </button>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div style={{
          marginTop: '1.5rem',
          background: '#ffffff',
          border: '1px solid #dadce0',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>⚡</div>
          <strong style={{ color: '#1a73e8' }}>Streaming Folder Chunks to Cloud Load Balancer...</strong>
          <p style={{ fontSize: '0.82rem', color: '#5f6368', margin: '4px 0 0 0' }}>
            Allocating worker pods and enforcing tenant quotas.
          </p>
        </div>
      )}

      {/* Completed State */}
      {currentRecord && (
        <div style={{
          marginTop: '1.5rem',
          background: '#ffffff',
          border: '1px solid #dadce0',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#202124' }}>
            Ingestion Pipeline Status
          </h2>
          <StatusCard
            status={currentRecord.status}
            filename={currentRecord.folderName || currentRecord.filename}
            errorMessage={currentRecord.failureReason}
          />
          <div style={{ marginTop: '12px', textAlign: 'right' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: '#1e8e3e',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Go to Live Dashboard →
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
