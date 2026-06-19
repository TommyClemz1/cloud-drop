import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

export const uploadFile = (formData, onProgress) =>
  API.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });

export const listFiles = () => API.get('/api/files');

export const downloadFile = (id) => API.get(`/api/files/${id}/download`);

export const deleteFile = (id) => API.delete(`/api/files/${id}`);
