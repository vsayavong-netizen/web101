/**
 * Custom hook for Frontend-Backend API Integration
 * Provides seamless integration between Frontend components and Backend APIs
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiResponse, ApiError } from '../utils/apiClient';
import { useToast } from './useToast';
import { useTranslations } from './useTranslations';

export interface UseApiIntegrationOptions {
  autoFetch?: boolean;
  onError?: (error: ApiError) => void;
  onSuccess?: (data: any) => void;
}

export const useApiIntegration = <T = any>(
  endpoint: string,
  options: UseApiIntegrationOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const addToast = useToast();
  const t = useTranslations();

  const {
    autoFetch = false,
    onError,
    onSuccess,
  } = options;

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response: ApiResponse<T> = await apiClient.get(endpoint);
      setData(response.data);
      onSuccess?.(response.data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      onError?.(apiError);
      addToast({
        type: 'error',
        message: apiError.message || t('apiError'),
      });
    } finally {
      setLoading(false);
    }
  }, [endpoint, onError, onSuccess, addToast, t]);

  // Create new resource
  const create = useCallback(async (newData: any) => {
    setLoading(true);
    setError(null);

    try {
      const response: ApiResponse<T> = await apiClient.post(endpoint, newData);
      setData(response.data);
      onSuccess?.(response.data);
      addToast({
        type: 'success',
        message: t('createSuccess'),
      });
      return response.data;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      onError?.(apiError);
      addToast({
        type: 'error',
        message: apiError.message || t('createError'),
      });
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [endpoint, onSuccess, onError, addToast, t]);

  // Update existing resource
  const update = useCallback(async (id: string, updateData: any) => {
    setLoading(true);
    setError(null);

    try {
      const response: ApiResponse<T> = await apiClient.put(`${endpoint}${id}/`, updateData);
      setData(response.data);
      onSuccess?.(response.data);
      addToast({
        type: 'success',
        message: t('updateSuccess'),
      });
      return response.data;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      onError?.(apiError);
      addToast({
        type: 'error',
        message: apiError.message || t('updateError'),
      });
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [endpoint, onSuccess, onError, addToast, t]);

  // Delete resource
  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.delete(`${endpoint}${id}/`);
      setData(null);
      addToast({
        type: 'success',
        message: t('deleteSuccess'),
      });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      onError?.(apiError);
      addToast({
        type: 'error',
        message: apiError.message || t('deleteError'),
      });
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [onError, addToast, t]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    data,
    loading,
    error,
    fetchData,
    create,
    update,
    remove,
    refetch: fetchData,
  };
};

// Specialized hooks for specific APIs
export const useProjects = () => {
  return useApiIntegration('/api/projects/', { autoFetch: true });
};

export const useStudents = () => {
  return useApiIntegration('/api/students/', { autoFetch: true });
};

export const useAdvisors = () => {
  return useApiIntegration('/api/advisors/', { autoFetch: true });
};

export const useFiles = (projectId?: string) => {
  const endpoint = projectId ? `/api/files/?project=${projectId}` : '/api/files/';
  return useApiIntegration(endpoint, { autoFetch: true });
};

export const useChannels = () => {
  return useApiIntegration('/api/communication/channels/', { autoFetch: true });
};

export const useNotifications = () => {
  return useApiIntegration('/api/notifications/', { autoFetch: true });
};

export const useAnalytics = () => {
  return useApiIntegration('/api/analytics/', { autoFetch: true });
};

export const useSettings = () => {
  return useApiIntegration('/api/settings/', { autoFetch: true });
};

// Authentication hook
export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const addToast = useToast();
  const t = useTranslations();

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiClient.login(username, password);
      // Backend returns { access, refresh, user }
      setUser((response.data as any).user || null);
      addToast({
        type: 'success',
        message: t('loginSuccess'),
      });
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      
      // แปลง error message ให้ชัดเจนขึ้น
      let errorMessage = t('loginError');
      
      if (apiError.message) {
        if (apiError.message.includes('Invalid credentials')) {
          errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
        } else if (apiError.message.includes('User account is disabled')) {
          errorMessage = 'บัญชีผู้ใช้นี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ';
        } else if (apiError.message.includes('Password change required')) {
          errorMessage = 'จำเป็นต้องเปลี่ยนรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ';
        } else if (apiError.message.includes('Must include username and password')) {
          errorMessage = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน';
        } else if (apiError.status === 400) {
          errorMessage = 'ข้อมูลที่ส่งไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
        } else if (apiError.status === 401) {
          errorMessage = 'การเข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง';
        } else if (apiError.status === 403) {
          errorMessage = 'ไม่มีสิทธิ์เข้าถึง กรุณาติดต่อผู้ดูแลระบบ';
        } else if (apiError.status === 500) {
          errorMessage = 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง';
        } else {
          errorMessage = apiError.message;
        }
      }
      
      addToast({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await apiClient.logout();
      setUser(null);
      addToast({
        type: 'success',
        message: t('logoutSuccess'),
      });
    } catch (error) {
      const apiError = error as ApiError;
      addToast({
        type: 'error',
        message: apiError.message || t('logoutError'),
      });
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  const register = useCallback(async (userData: any) => {
    setLoading(true);
    try {
      const response = await apiClient.register(userData);
      addToast({
        type: 'success',
        message: t('registerSuccess'),
      });
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      addToast({
        type: 'error',
        message: apiError.message || t('registerError'),
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  return {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };
};
