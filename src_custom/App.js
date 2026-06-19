import React, { useState, useEffect, useCallback } from 'react';
import { uploadFile, listFiles, downloadFile, deleteFile } from './api';
import './App.css';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString();
}

function getFileIcon(mimeType) {
  if (!mimeType) return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  return '📄';
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [dragging, setDragging] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await listFiles();
      setFiles(res.data);
    } catch {
      setError('Could not load files. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const showMessage = (type, msg) => {
    if (type === 'success') { setSuccess(msg); setError(''); }
    else { setError(msg); setSuccess(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      showMessage('error', 'File exceeds the 25MB limit.');
      return;
    }
    setUploading(true);
    setProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await uploadFile(formData, setProgress);
      showMessage('success', `"${file.name}" uploaded successfully!`);
      fetchFiles();
    } catch {
      showMessage('error', 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files[0]) handleUpload(e.target.files[0]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDownload = async (file) => {
    try {
      const res = await downloadFile(file.id);
      window.open(res.data.downloadUrl, '_blank');
    } catch {
      showMessage('error', 'Could not generate download link.');
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.original_name}"? This cannot be undone.`)) return;
    setDeletingId(file.id);
    try {
      await deleteFile(file.id);
      showMessage('success', `"${file.original_name}" deleted.`);
      fetchFiles();
    } catch {
      showMessage('error', 'Delete failed. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">☁️</span>
            <span className="logo-text">CloudDrop</span>
          </div>
          <span className="header-sub">Secure file storage on AWS</span>
        </div>
      </header>

      <main className="main">
        {/* Upload zone */}
        <div
          className={`upload-zone ${dragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="upload-progress">
              <div className="spinner" />
              <p className="upload-label">Uploading... {progress}%</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <div className="upload-icon">📤</div>
              <p className="upload-label">Drag & drop a file here</p>
              <p className="upload-sub">or</p>
              <label className="btn btn-primary">
                Choose File
                <input type="file" onChange={handleFileInput} hidden />
              </label>
              <p className="upload-limit">Max file size: 25MB</p>
            </>
          )}
        </div>

        {/* Notifications */}
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {success && <div className="alert alert-success">✅ {success}</div>}

        {/* File list */}
        <div className="files-section">
          <div className="files-header">
            <h2 className="files-title">Your Files</h2>
            <span className="files-count">{files.length} file{files.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner" />
              <p>Loading files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗂️</div>
              <p>No files uploaded yet. Upload your first file above!</p>
            </div>
          ) : (
            <div className="file-list">
              {files.map((file) => (
                <div key={file.id} className="file-card">
                  <div className="file-icon">{getFileIcon(file.mime_type)}</div>
                  <div className="file-info">
                    <p className="file-name">{file.original_name}</p>
                    <p className="file-meta">
                      {formatBytes(file.size_bytes)} &nbsp;·&nbsp; {formatDate(file.uploaded_at)}
                    </p>
                  </div>
                  <div className="file-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDownload(file)}
                      title="Download"
                    >
                      ⬇️ Download
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(file)}
                      disabled={deletingId === file.id}
                      title="Delete"
                    >
                      {deletingId === file.id ? '...' : '🗑️ Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>CloudDrop — Built on AWS (EC2 · S3 · RDS) · Group 5 Capstone Project</p>
      </footer>
    </div>
  );
}
