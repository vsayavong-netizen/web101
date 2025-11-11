/**
 * File Storage Utility
 * Migrates from localStorage to Backend File API
 */
import { apiClient } from './apiClient';

export interface FileUploadPayload {
  name: string;
  type: string;
  size: number;
  dataUrl?: string; // For backward compatibility
}

export interface FileMetadata {
  fileId: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  dataUrl?: string; // Fallback for localStorage
}

/**
 * Upload file to Backend API
 */
export const uploadFile = async (
  file: File,
  projectId: string,
  fileType: string = 'document'
): Promise<FileMetadata> => {
  try {
    // Try to upload via Backend API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);
    formData.append('file_type', fileType);

    // Use fetch directly for FormData upload
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const baseURL = getBaseURL();
    const response = await fetch(`${baseURL}/api/files/upload/`, {
      method: 'POST',
      body: formData,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();

    if (data) {
      return {
        fileId: data.id || data.file_id,
        name: data.file_name || file.name,
        type: data.file_type || file.type,
        size: data.file_size || file.size,
        url: data.file_url || data.url,
      };
    }

    throw new Error('Invalid response from server');
  } catch (error: any) {
    console.warn('Backend file upload failed, using localStorage fallback:', error);
    
    // Fallback to localStorage
    const fileId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        try {
          localStorage.setItem(`file_${fileId}`, dataUrl);
          resolve({
            fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl,
          });
        } catch (storageError) {
          reject(new Error('Storage limit reached'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
};

/**
 * Get file from Backend API or localStorage fallback
 */
export const getFile = async (fileId: string): Promise<string | null> => {
  // Check if it's a local file ID
  if (fileId.startsWith('local_')) {
    return localStorage.getItem(`file_${fileId}`);
  }

  try {
    // Try to get from Backend API
    const response = await apiClient.get(`/api/files/${fileId}/download/`);
    
    if (response.data && response.data.file_url) {
      // Return file URL or fetch file content
      return response.data.file_url;
    }

    if (response.data && response.data.file_content) {
      // If file content is in response
      return response.data.file_content;
    }

    // If response is a blob/file
    if (response.data instanceof Blob) {
      return URL.createObjectURL(response.data);
    }

    throw new Error('Invalid file response');
  } catch (error: any) {
    console.warn('Backend file download failed, trying localStorage fallback:', error);
    
    // Fallback to localStorage
    return localStorage.getItem(`file_${fileId}`);
  }
};

/**
 * Delete file from Backend API
 */
export const deleteFile = async (fileId: string): Promise<void> => {
  // Check if it's a local file ID
  if (fileId.startsWith('local_')) {
    localStorage.removeItem(`file_${fileId}`);
    return;
  }

  try {
    await apiClient.delete(`/api/files/${fileId}/`);
  } catch (error: any) {
    console.warn('Backend file delete failed, removing from localStorage:', error);
    // Fallback: remove from localStorage
    localStorage.removeItem(`file_${fileId}`);
  }
};

/**
 * Get file metadata
 */
export const getFileMetadata = async (fileId: string): Promise<FileMetadata | null> => {
  // Check if it's a local file ID
  if (fileId.startsWith('local_')) {
    const dataUrl = localStorage.getItem(`file_${fileId}`);
    if (!dataUrl) return null;
    
    // Extract metadata from data URL
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    
    return {
      fileId,
      name: `file_${fileId}`,
      type: match[1],
      size: (match[2].length * 3) / 4, // Approximate size
      dataUrl,
    };
  }

  try {
    const response = await apiClient.get(`/api/files/${fileId}/`);
    
    if (response.data) {
      return {
        fileId: response.data.id || response.data.file_id,
        name: response.data.file_name || 'Unknown',
        type: response.data.file_type || 'application/octet-stream',
        size: response.data.file_size || 0,
        url: response.data.file_url || response.data.url,
      };
    }

    return null;
  } catch (error: any) {
    console.warn('Backend file metadata fetch failed:', error);
    return null;
  }
};

