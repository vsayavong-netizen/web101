/**
 * Hook for managing Academic Year
 * Connects frontend with backend API
 */
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/apiClient';
import { useToast } from './useToast';
import { useTranslations } from './useTranslations';

export interface AcademicYear {
  id: number;
  year: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export const useAcademicYear = () => {
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const addToast = useToast();
  const t = useTranslations();

  /**
   * Load available academic years from API
   */
  const loadAcademicYears = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated before making API call
      const token = localStorage.getItem('auth_token');
      if (!token) {
        // User is not authenticated, use localStorage fallback
        const storedYears = localStorage.getItem('academicYears');
        if (storedYears) {
          const years = JSON.parse(storedYears);
          setAvailableYears(years);
          if (years.length > 0) {
            setCurrentAcademicYear(years[years.length - 1]);
          }
        } else {
          // Initialize with default year
          const INITIAL_YEAR = '2024';
          setAvailableYears([INITIAL_YEAR]);
          setCurrentAcademicYear(INITIAL_YEAR);
        }
        setLoading(false);
        return;
      }

      // Try to get from API first (only if authenticated)
      const response = await apiClient.getAvailableAcademicYears();
      
      // Handle 401 Unauthorized - user not logged in (fallback)
      if (response.status === 401) {
        // User is not authenticated, use localStorage fallback
        const storedYears = localStorage.getItem('academicYears');
        if (storedYears) {
          const years = JSON.parse(storedYears);
          setAvailableYears(years);
          if (years.length > 0) {
            setCurrentAcademicYear(years[years.length - 1]);
          }
        } else {
          // Initialize with default year
          const INITIAL_YEAR = '2024';
          setAvailableYears([INITIAL_YEAR]);
          setCurrentAcademicYear(INITIAL_YEAR);
        }
        setLoading(false);
        return;
      }
      
      if (response.data && Array.isArray(response.data)) {
        const years = response.data.map((ay: AcademicYear) => ay.year);
        setAvailableYears(years);
        setAcademicYears(response.data);

        // Get current active year
        try {
          const currentResponse = await apiClient.getCurrentAcademicYear();
          if (currentResponse.data && currentResponse.status !== 404) {
            const currentYear = currentResponse.data.year;
            setCurrentAcademicYear(currentYear);
          } else if (years.length > 0) {
            // Fallback to latest year if no active year
            setCurrentAcademicYear(years[years.length - 1]);
          }
        } catch (err: any) {
          // Handle 404 or other errors gracefully
          if (years.length > 0) {
            setCurrentAcademicYear(years[years.length - 1]);
          }
        }
      } else {
        // Fallback to localStorage if API fails
        const storedYears = localStorage.getItem('academicYears');
        if (storedYears) {
          const years = JSON.parse(storedYears);
          setAvailableYears(years);
          if (years.length > 0) {
            setCurrentAcademicYear(years[years.length - 1]);
          }
        } else {
          // Initialize with default year
          const INITIAL_YEAR = '2024';
          setAvailableYears([INITIAL_YEAR]);
          setCurrentAcademicYear(INITIAL_YEAR);
        }
      }
    } catch (err: any) {
      console.error('Failed to load academic years:', err);
      setError(err.message || 'Failed to load academic years');
      
      // Fallback to localStorage
      const storedYears = localStorage.getItem('academicYears');
      if (storedYears) {
        const years = JSON.parse(storedYears);
        setAvailableYears(years);
        if (years.length > 0) {
          setCurrentAcademicYear(years[years.length - 1]);
        }
      } else {
        const INITIAL_YEAR = '2024';
        setAvailableYears([INITIAL_YEAR]);
        setCurrentAcademicYear(INITIAL_YEAR);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Change current academic year
   */
  const changeAcademicYear = useCallback(async (year: string) => {
    try {
      setCurrentAcademicYear(year);
      
      // Update localStorage as backup
      localStorage.setItem('currentAcademicYear', year);
      
      addToast({
        type: 'success',
        message: t('academicYearChanged').replace('${year}', year) || `Academic year changed to ${year}`
      });
    } catch (err: any) {
      console.error('Failed to change academic year:', err);
      addToast({
        type: 'error',
        message: err.message || 'Failed to change academic year'
      });
    }
  }, [addToast, t]);

  /**
   * Start new academic year (create next year)
   */
  const startNewYear = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await apiClient.createNextAcademicYear();
      
      if (response.data && response.data.data) {
        const newYear = response.data.data;
        const newYearStr = newYear.year;
        
        // Update available years
        const updatedYears = [...availableYears, newYearStr];
        setAvailableYears(updatedYears);
        setCurrentAcademicYear(newYearStr);
        
        // Update localStorage as backup
        localStorage.setItem('academicYears', JSON.stringify(updatedYears));
        localStorage.setItem('currentAcademicYear', newYearStr);
        
        addToast({
          type: 'success',
          message: response.data.message || t('newYearStarted').replace('${year}', newYearStr) || `New academic year ${newYearStr} started`
        });
        
        // Reload academic years to get updated list
        await loadAcademicYears();
      }
    } catch (err: any) {
      console.error('Failed to start new academic year:', err);
      addToast({
        type: 'error',
        message: err.message || 'Failed to start new academic year'
      });
    } finally {
      setLoading(false);
    }
  }, [availableYears, addToast, t, loadAcademicYears]);

  /**
   * Activate an academic year
   */
  const activateAcademicYear = useCallback(async (id: number) => {
    try {
      setLoading(true);
      
      const response = await apiClient.activateAcademicYear(id);
      
      if (response.data && response.data.data) {
        const activatedYear = response.data.data;
        setCurrentAcademicYear(activatedYear.year);
        
        // Reload academic years
        await loadAcademicYears();
        
        addToast({
          type: 'success',
          message: response.data.message || `Academic year ${activatedYear.year} activated`
        });
      }
    } catch (err: any) {
      console.error('Failed to activate academic year:', err);
      addToast({
        type: 'error',
        message: err.message || 'Failed to activate academic year'
      });
    } finally {
      setLoading(false);
    }
  }, [addToast, loadAcademicYears]);

  // Load academic years on mount
  useEffect(() => {
    loadAcademicYears();
  }, [loadAcademicYears]);

  return {
    currentAcademicYear,
    availableYears,
    academicYears,
    loading,
    error,
    changeAcademicYear,
    startNewYear,
    activateAcademicYear,
    reloadAcademicYears: loadAcademicYears,
  };
};

