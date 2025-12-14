import React, { useState, useEffect } from 'react';
import * as api from '../api';

const MyFilesPage = ({ onFileSelect }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    try {
      setLoading(true);
      const data = await api.listFiles();
      setFiles(data.files || []);
    } catch (err) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }

  const [downloading, setDownloading] = useState(null);

  const handleFileClick = async (file) => {
    try {
      setDownloading(file.id);
      // Fetch file with credentials to get a blob URL
      const response = await fetch(api.getFileUrl(file.id), {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to load file');
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      onFileSelect(blobUrl, file.filename);
    } catch (err) {
      setError(err.message || 'Failed to load file');
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-sans)',
      }}>
        Loading files...
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem 3rem',
      height: '100%',
      overflow: 'auto',
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontFamily: 'var(--font-serif)',
          color: 'var(--text-main)',
          fontWeight: 'normal',
          letterSpacing: '-0.02em',
          marginBottom: '0.5rem',
        }}>
          My Files
        </h2>
        <p style={{
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.95rem',
        }}>
          Your saved CAD files
        </p>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#ef4444',
          fontSize: '0.9rem',
          fontFamily: 'var(--font-sans)',
          marginBottom: '1.5rem',
        }}>
          {error}
        </div>
      )}

      {files.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📁</div>
          <p>No files uploaded yet</p>
          <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
            Upload a CAD file in Robot Config to get started
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}>
          {files.map((file) => {
            const isDownloading = downloading === file.id;
            return (
            <div
              key={file.id}
              onClick={() => !isDownloading && handleFileClick(file)}
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--surface)',
                border: `1px solid ${isDownloading ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '8px',
                cursor: isDownloading ? 'wait' : 'pointer',
                transition: 'all 0.2s',
                opacity: isDownloading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isDownloading) {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDownloading) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{
                fontSize: '1.5rem',
                marginBottom: '0.75rem',
              }}>
                {isDownloading ? '⏳' : '🗂️'}
              </div>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.95rem',
                color: 'var(--text-main)',
                marginBottom: '0.5rem',
                wordBreak: 'break-word',
              }}>
                {file.filename}
              </div>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem',
                color: isDownloading ? 'var(--primary)' : 'var(--text-muted)',
              }}>
                {isDownloading ? 'Loading...' : formatDate(file.uploaded_at)}
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
};

export default MyFilesPage;
