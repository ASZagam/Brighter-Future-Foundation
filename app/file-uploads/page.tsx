'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '../../lib/api';

interface UploadRecord {
  id: number;
  title: string;
  description: string;
  upload_type: string;
  file_url: string;
  content_type: string;
  size: number;
  is_active: boolean;
  created_at: string;
}

export default function FileUploadsPage() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadType, setUploadType] = useState('document');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadUploads() {
      try {
        const data = await apiGet<UploadRecord[]>('/core/file-uploads/');
        setUploads(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load file uploads.');
      } finally {
        setLoading(false);
      }
    }
    loadUploads();
  }, []);

  async function submitUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError('Please choose a file before uploading.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title || file.name);
      formData.append('description', description);
      formData.append('upload_type', uploadType);
      formData.append('file', file);

      const response = await fetch('/api/core/file-uploads/', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Upload failed.');
      }

      const newRecord = await response.json();
      setUploads((current) => [newRecord, ...current]);
      setTitle('');
      setDescription('');
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Unable to complete file upload.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className='page-shell' style={{ padding: '3rem 0' }}>
      <div className='section-title'>
        <div>
          <p className='eyebrow'>File Upload System</p>
          <h1>Upload images and documents securely</h1>
        </div>
        <Link href='/core' className='button-link'>Return to Core</Link>
      </div>

      <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
        <p className='text-muted'>Add documents or image assets for your organization. Supported formats include PDF, DOCX, XLSX, PNG, JPG and more.</p>
      </div>

      <div className='form-panel' style={{ marginBottom: 32 }}>
        <form onSubmit={submitUpload}>
          <div className='form-grid' style={{ display: 'grid', gap: 16 }}>
            <div className='form-field'>
              <label className='field-label'>Title</label>
              <input
                type='text'
                className='field-input'
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder='Enter title or leave blank to use file name'
              />
            </div>
            <div className='form-field'>
              <label className='field-label'>Description</label>
              <textarea
                className='field-textarea'
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder='Optional description for the uploaded file'
              />
            </div>
            <div className='form-field'>
              <label className='field-label'>Upload type</label>
              <select className='field-select' value={uploadType} onChange={(event) => setUploadType(event.target.value)}>
                <option value='document'>Document</option>
                <option value='image'>Image</option>
              </select>
            </div>
            <div className='form-field'>
              <label className='field-label'>Choose file</label>
              <input
                type='file'
                className='field-input'
                onChange={(event) => setFile(event.target.files ? event.target.files[0] : null)}
              />
            </div>
          </div>

          {error ? <p style={{ marginTop: 16, color: '#b91c1c' }}>{error}</p> : null}
          <button type='submit' className='button-link' style={{ marginTop: 20, opacity: uploading ? 0.7 : 1 }} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload file'}
          </button>
        </form>
      </div>

      <div>
        <div className='section-title' style={{ marginBottom: 18 }}>
          <div>
            <p className='eyebrow'>Recent Uploads</p>
            <h2 style={{ margin: 0 }}>Latest assets</h2>
          </div>
        </div>

        {loading ? (
          <p>Loading uploads…</p>
        ) : uploads.length === 0 ? (
          <div className='card'>
            <p style={{ margin: 0, color: '#475569' }}>No uploads yet. Submit a file to get started.</p>
          </div>
        ) : (
          <div className='card-grid'>
            {uploads.map((upload) => (
              <div key={upload.id} className='card'>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                  <div>
                    <p className='eyebrow'>{upload.upload_type === 'image' ? 'Image' : 'Document'}</p>
                    <h3 style={{ margin: '0.8rem 0 0' }}>{upload.title || 'Untitled file'}</h3>
                  </div>
                  <span className='action-button' style={{ minHeight: 'auto', padding: '10px 14px' }}>{upload.is_active ? 'Active' : 'Disabled'}</span>
                </div>
                <p style={{ margin: '16px 0 0', color: '#475569' }}>{upload.description || 'No description provided.'}</p>
                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <a href={upload.file_url} target='_blank' rel='noreferrer' className='button-link' style={{ background: '#0f172a' }}>
                    Open file
                  </a>
                  <p style={{ margin: 0, color: '#64748b' }}>{(upload.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
