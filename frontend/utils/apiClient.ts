/**
 * API Client for Frontend-Backend Integration
 * Handles all API communication between Frontend and Backend
 */

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  details?: any;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || (typeof window !== 'undefined' && (window as any).__API_BASE_URL) || 'http://localhost:8000') {
    // Ensure baseURL doesn't end with slash to prevent double slashes
    this.baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    this.token = localStorage.getItem('auth_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Set access and refresh tokens
   */
  setTokens(accessToken: string, refreshToken?: string | null) {
    this.setToken(accessToken);
    if (typeof refreshToken === 'string') {
      this.refreshToken = refreshToken;
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
    this.refreshToken = null;
    localStorage.removeItem('refresh_token');
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Always try to get fresh token from localStorage in case it was updated
    const currentToken = localStorage.getItem('auth_token');
    if (currentToken) {
      this.token = currentToken;
      headers['Authorization'] = `Bearer ${currentToken}`;
    } else if (this.token) {
      // Fallback to instance token if localStorage doesn't have it
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Ensure endpoint starts with slash to prevent double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseURL}${cleanEndpoint}`;
    
    // Get fresh token from localStorage before each request
    const currentToken = localStorage.getItem('auth_token');
    if (currentToken && currentToken !== this.token) {
      this.token = currentToken;
    }
    
    // Get headers with fresh token
    const headers = this.getHeaders();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });
      // Try to parse JSON safely
      const tryParseJson = async () => {
        try {
          return await response.json();
        } catch {
          return null as any;
        }
      };
      let data = await tryParseJson();

      if (response.status === 401) {
        // For login endpoint, don't try to refresh token - just return the error
        const isLoginEndpoint = endpoint.includes('/api/auth/login');
        
        if (!isLoginEndpoint) {
          // Try to refresh token if we have a refresh token (only for non-login endpoints)
          if (this.refreshToken || localStorage.getItem('refresh_token')) {
            const refreshed = await this.tryRefreshToken();
            if (refreshed) {
              // Retry the request with new token
              const retryResponse = await fetch(url, {
                ...options,
                headers: {
                  ...this.getHeaders(),
                  ...options.headers,
                },
              });
              data = await tryParseJson.call({ response: retryResponse });
              if (!retryResponse.ok) {
                throw new Error((data && data.message) || `HTTP ${retryResponse.status}`);
              }
              return {
                data,
                status: retryResponse.status,
                message: data?.message,
              };
            }
          }
        }
        
        // If refresh failed or no refresh token, or it's a login endpoint
        // For login endpoint, don't clear tokens (user might just have wrong credentials)
        if (!isLoginEndpoint) {
          this.clearToken();
          // Notify global handler if exists
          if (typeof window !== 'undefined' && (window as any).onAuthExpired) {
            try { (window as any).onAuthExpired(); } catch {}
          }
        }
        
        // Return error response instead of throwing
        // Extract error message from response
        let errorMessage = 'Authentication required';
        if (data) {
          if (data.detail) {
            errorMessage = data.detail;
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
            errorMessage = data.non_field_errors[0];
          } else if (typeof data === 'string') {
            errorMessage = data;
          }
        }
        
        return {
          data: data || { error: 'Unauthorized', message: errorMessage },
          status: 401,
          error: 'Unauthorized',
          message: errorMessage,
        };
      }

      if (!response.ok) {
        // จัดการ error response ให้ดีขึ้น
        let errorMessage = `HTTP ${response.status}`;
        
        if (data) {
          if (data.non_field_errors && data.non_field_errors.length > 0) {
            errorMessage = data.non_field_errors[0];
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.error) {
            errorMessage = data.error;
          } else if (data.detail) {
            errorMessage = data.detail;
          }
        }
        
        const error = new Error(errorMessage) as any;
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return {
        data,
        status: response.status,
        message: data?.message,
      };
    } catch (error) {
      throw {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
        details: error,
      } as ApiError;
    }
  }

  /**
   * Attempt to refresh access token using refresh token
   */
  private async tryRefreshToken(): Promise<boolean> {
    // Get refresh token from localStorage if not in instance
    const refreshToken = this.refreshToken || localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${this.baseURL}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (!res.ok) {
        return false;
      }
      const data = await res.json();
      const newAccess = data.access || data.token;
      if (newAccess) {
        this.setToken(newAccess);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Authentication APIs
  async login(username: string, password: string) {
    try {
      const res = await this.post('/api/auth/login/', { 
        username: username.trim(),
        password: password.trim()
      });
      
      // Check if response has error (401 case)
      if (res.status === 401 || res.error) {
        // Extract error message from response
        let errorMessage = 'Invalid username or password';
        
        if (res.data) {
          // Try to get detailed error message from backend
          if (res.data.detail) {
            errorMessage = res.data.detail;
          } else if (res.data.message) {
            errorMessage = res.data.message;
          } else if (res.data.non_field_errors && Array.isArray(res.data.non_field_errors)) {
            errorMessage = res.data.non_field_errors[0];
          } else if (typeof res.data === 'string') {
            errorMessage = res.data;
          }
        }
        
        throw {
          message: errorMessage,
          status: 401,
          details: res.data
        } as ApiError;
      }
      
      // Handle both token formats
      const access = res.data?.access || res.data?.token;
      const refresh = res.data?.refresh;
      const user = res.data?.user;

      if (access) {
        this.setTokens(access, refresh);
        return {
          data: {
            user,
            access,
            refresh
          },
          status: res.status,
          message: 'Login successful'
        };
      } else {
        throw new Error('No access token received');
      }
    } catch (error: any) {
      // Enhanced error handling
      const apiError = error as ApiError;
      let errorMessage = 'Login failed';
      
      // If error already has a message, use it
      if (apiError.message && apiError.message !== 'Login failed') {
        errorMessage = apiError.message;
      } else if (apiError.status === 401) {
        errorMessage = 'Invalid username or password';
      } else if (apiError.status === 400) {
        errorMessage = 'Please enter both username and password';
      } else if (apiError.status === 500) {
        errorMessage = 'Server error, please try again later';
      } else if (apiError.details?.data) {
        // Try to extract error from backend response
        const details = apiError.details.data;
        if (details.detail) {
          errorMessage = details.detail;
        } else if (details.non_field_errors && Array.isArray(details.non_field_errors)) {
          errorMessage = details.non_field_errors[0];
        } else if (details.message) {
          errorMessage = details.message;
        }
      }
      
      throw {
        message: errorMessage,
        status: apiError.status || 500,
        details: apiError.details || apiError
      } as ApiError;
    }
  }

  async register(userData: any) {
    return this.post('/api/auth/register/', userData);
  }

  async logout() {
    this.clearToken();
    return this.post('/api/auth/logout/');
  }

  // Project Management APIs
  /**
   * Advanced search projects with comprehensive filters
   */
  async searchProjects(searchParams: {
    query?: string;
    status?: string;
    statuses?: string[];
    advisor?: string;
    advisor_ids?: string[];
    major?: string;
    majors?: string[];
    student_id?: string;
    student_name?: string;
    gender?: string;
    created_after?: string;
    created_before?: string;
    defense_after?: string;
    defense_before?: string;
    scheduled?: boolean;
    has_defense_date?: boolean;
    defense_room?: string;
    min_score?: number;
    max_score?: number;
    has_grade?: boolean;
    has_pending_milestones?: boolean;
    milestone_count_min?: number;
    milestone_count_max?: number;
    has_committee?: boolean;
    committee_member?: string;
    academic_year?: string;
    has_similarity_issues?: boolean;
    ordering?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<{
    results: any[];
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>> {
    const queryParams = new URLSearchParams();
    
    if (searchParams.query) queryParams.append('query', searchParams.query);
    if (searchParams.status) queryParams.append('status', searchParams.status);
    if (searchParams.statuses) {
      searchParams.statuses.forEach(s => queryParams.append('statuses', s));
    }
    if (searchParams.advisor) queryParams.append('advisor', searchParams.advisor);
    if (searchParams.advisor_ids) {
      searchParams.advisor_ids.forEach(id => queryParams.append('advisor_ids', id));
    }
    if (searchParams.major) queryParams.append('major', searchParams.major);
    if (searchParams.majors) {
      searchParams.majors.forEach(m => queryParams.append('majors', m));
    }
    if (searchParams.student_id) queryParams.append('student_id', searchParams.student_id);
    if (searchParams.student_name) queryParams.append('student_name', searchParams.student_name);
    if (searchParams.gender) queryParams.append('gender', searchParams.gender);
    if (searchParams.created_after) queryParams.append('created_after', searchParams.created_after);
    if (searchParams.created_before) queryParams.append('created_before', searchParams.created_before);
    if (searchParams.defense_after) queryParams.append('defense_after', searchParams.defense_after);
    if (searchParams.defense_before) queryParams.append('defense_before', searchParams.defense_before);
    if (searchParams.scheduled !== undefined) queryParams.append('scheduled', String(searchParams.scheduled));
    if (searchParams.has_defense_date !== undefined) queryParams.append('has_defense_date', String(searchParams.has_defense_date));
    if (searchParams.defense_room) queryParams.append('defense_room', searchParams.defense_room);
    if (searchParams.min_score !== undefined) queryParams.append('min_score', String(searchParams.min_score));
    if (searchParams.max_score !== undefined) queryParams.append('max_score', String(searchParams.max_score));
    if (searchParams.has_grade !== undefined) queryParams.append('has_grade', String(searchParams.has_grade));
    if (searchParams.has_pending_milestones !== undefined) queryParams.append('has_pending_milestones', String(searchParams.has_pending_milestones));
    if (searchParams.milestone_count_min !== undefined) queryParams.append('milestone_count_min', String(searchParams.milestone_count_min));
    if (searchParams.milestone_count_max !== undefined) queryParams.append('milestone_count_max', String(searchParams.milestone_count_max));
    if (searchParams.has_committee !== undefined) queryParams.append('has_committee', String(searchParams.has_committee));
    if (searchParams.committee_member) queryParams.append('committee_member', searchParams.committee_member);
    if (searchParams.academic_year) queryParams.append('academic_year', searchParams.academic_year);
    if (searchParams.has_similarity_issues !== undefined) queryParams.append('has_similarity_issues', String(searchParams.has_similarity_issues));
    if (searchParams.ordering) queryParams.append('ordering', searchParams.ordering);
    if (searchParams.page) queryParams.append('page', String(searchParams.page));
    if (searchParams.page_size) queryParams.append('page_size', String(searchParams.page_size));
    
    return this.request(`/api/projects/search/?${queryParams.toString()}`);
  }

  async getProjects(params?: { academic_year?: string; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.academic_year) queryParams.append('academic_year', params.academic_year);
    if (params?.status) queryParams.append('status', params.status);
    const query = queryParams.toString();
    return this.get(`/api/projects/${query ? `?${query}` : ''}`);
  }

  async getProject(id: number | string) {
    return this.get(`/api/projects/${id}/`);
  }

  /**
   * Export projects to CSV or Excel
   */
  async exportProjects(format: 'csv' | 'excel' = 'csv', searchParams?: any): Promise<Blob> {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    
    // Add search params if provided
    if (searchParams) {
      Object.keys(searchParams).forEach(key => {
        const value = searchParams[key];
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, String(v)));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }
    
    const response = await fetch(`${this.baseURL}/api/projects/export/?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    
    return response.blob();
  }

  /**
   * Import projects from CSV or Excel file
   */
  async importProjects(file: File, format: 'csv' | 'excel' = 'csv', academicYear?: string): Promise<ApiResponse<{
    success_count: number;
    error_count: number;
    errors: string[];
    message: string;
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    if (academicYear) {
      formData.append('academic_year', academicYear);
    }
    
    const headers = this.getHeaders();
    // Remove Content-Type header to let browser set it with boundary for FormData
    delete headers['Content-Type'];
    
    return this.request('/api/projects/import_data/', {
      method: 'POST',
      headers,
      body: formData,
    });
  }

  async createProject(projectData: any) {
    return this.post('/api/projects/', projectData);
  }

  async updateProject(id: number | string, projectData: any) {
    return this.patch(`/api/projects/${id}/`, projectData);
  }

  async deleteProject(id: number | string) {
    return this.delete(`/api/projects/${id}/`);
  }

  // Students APIs
  async getStudents(params?: { academic_year?: string; major?: string; classroom?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.academic_year) queryParams.append('academic_year', params.academic_year);
    if (params?.major) queryParams.append('major', params.major);
    if (params?.classroom) queryParams.append('classroom', params.classroom);
    const query = queryParams.toString();
    return this.get(`/api/students/${query ? `?${query}` : ''}`);
  }

  async getStudent(id: number | string) {
    return this.get(`/api/students/${id}/`);
  }

  async createStudent(studentData: any) {
    return this.post('/api/students/', studentData);
  }

  async updateStudent(id: number | string, studentData: any) {
    return this.patch(`/api/students/${id}/`, studentData);
  }

  async deleteStudent(id: number | string) {
    return this.delete(`/api/students/${id}/`);
  }

  // Advisors APIs
  async getAdvisors(params?: { academic_year?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.academic_year) queryParams.append('academic_year', params.academic_year);
    const query = queryParams.toString();
    return this.get(`/api/advisors/${query ? `?${query}` : ''}`);
  }

  async getAdvisor(id: number | string) {
    return this.get(`/api/advisors/${id}/`);
  }

  async createAdvisor(advisorData: any) {
    return this.post('/api/advisors/', advisorData);
  }

  async updateAdvisor(id: number | string, advisorData: any) {
    return this.patch(`/api/advisors/${id}/`, advisorData);
  }

  async deleteAdvisor(id: number | string) {
    return this.delete(`/api/advisors/${id}/`);
  }

  // Majors APIs
  async getMajors(params?: { academic_year?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.academic_year) queryParams.append('academic_year', params.academic_year);
    const query = queryParams.toString();
    return this.get(`/api/majors/${query ? `?${query}` : ''}`);
  }

  async getMajor(id: number | string) {
    return this.get(`/api/majors/${id}/`);
  }

  async createMajor(majorData: any) {
    return this.post('/api/majors/', majorData);
  }

  async updateMajor(id: number | string, majorData: any) {
    return this.patch(`/api/majors/${id}/`, majorData);
  }

  async deleteMajor(id: number | string) {
    return this.delete(`/api/majors/${id}/`);
  }

  // Classrooms APIs
  async getClassrooms(params?: { academic_year?: string; major?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.academic_year) queryParams.append('academic_year', params.academic_year);
    if (params?.major) queryParams.append('major', params.major);
    const query = queryParams.toString();
    return this.get(`/api/classrooms/${query ? `?${query}` : ''}`);
  }

  async getClassroom(id: number | string) {
    return this.get(`/api/classrooms/${id}/`);
  }

  async createClassroom(classroomData: any) {
    return this.post('/api/classrooms/', classroomData);
  }

  async updateClassroom(id: number | string, classroomData: any) {
    return this.patch(`/api/classrooms/${id}/`, classroomData);
  }

  async deleteClassroom(id: number | string) {
    return this.delete(`/api/classrooms/${id}/`);
  }

  // Security Audit APIs
  async getSecurityAuditTimestamp(academicYear?: string) {
    if (academicYear) {
      return this.get(`/api/settings/security-audit/${academicYear}/`);
    }
    return this.get('/api/settings/security-audit/');
  }

  async updateSecurityAuditTimestamp(academicYear: string, timestamp?: string) {
    return this.post(`/api/settings/security-audit/${academicYear}/`, {
      timestamp: timestamp || String(Date.now())
    });
  }

  // App Settings APIs
  /**
   * Get application setting by type and academic year
   * @param settingType - Type of setting: 'milestone_templates', 'announcements', 'defense_settings', 'scoring_settings'
   * @param academicYear - Academic year (optional, defaults to current active year)
   */
  async getAppSetting(settingType: 'milestone_templates' | 'announcements' | 'defense_settings' | 'scoring_settings', academicYear?: string) {
    if (academicYear) {
      return this.get(`/api/settings/app-settings/${settingType}/${academicYear}/`);
    }
    return this.get(`/api/settings/app-settings/${settingType}/`);
  }

  /**
   * Update or create application setting
   * @param settingType - Type of setting
   * @param value - Setting value (object or array)
   * @param academicYear - Academic year (optional, defaults to current active year)
   */
  async updateAppSetting(
    settingType: 'milestone_templates' | 'announcements' | 'defense_settings' | 'scoring_settings',
    value: any,
    academicYear?: string
  ) {
    const payload = { value };
    if (academicYear) {
      return this.post(`/api/settings/app-settings/${settingType}/${academicYear}/`, payload);
    }
    return this.post(`/api/settings/app-settings/${settingType}/`, payload);
  }

  /**
   * Delete application setting
   * @param settingType - Type of setting
   * @param academicYear - Academic year (optional, defaults to current active year)
   */
  async deleteAppSetting(
    settingType: 'milestone_templates' | 'announcements' | 'defense_settings' | 'scoring_settings',
    academicYear?: string
  ) {
    if (academicYear) {
      return this.delete(`/api/settings/app-settings/${settingType}/${academicYear}/`);
    }
    return this.delete(`/api/settings/app-settings/${settingType}/`);
  }

  // File Management APIs
  async uploadFile(file: File, projectId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project', projectId);

    return this.request('/api/files/upload/', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
      },
    });
  }

  async getFiles(projectId?: string) {
    const endpoint = projectId ? `/api/files/?project=${projectId}` : '/api/files/';
    return this.get(endpoint);
  }

  async downloadFile(fileId: string) {
    return this.get(`/api/files/${fileId}/download/`);
  }

  // Communication APIs
  async getChannels() {
    return this.get('/api/communication/channels/');
  }

  async createChannel(channelData: any) {
    return this.post('/api/communication/channels/', channelData);
  }

  async getMessages(channelId: string) {
    return this.get(`/api/communication/channels/${channelId}/messages/`);
  }

  async sendMessage(channelId: string, message: string) {
    return this.post(`/api/communication/channels/${channelId}/messages/`, {
      content: message,
    });
  }

  // AI Enhancement APIs
  async checkPlagiarism(text: string) {
    return this.post('/api/ai-enhancement/plagiarism/', { text });
  }

  async checkGrammar(text: string) {
    return this.post('/api/ai-enhancement/grammar/', { text });
  }

  async getTopicSuggestions(projectId: string) {
    return this.get(`/api/ai-enhancement/topics/?project=${projectId}`);
  }

  // Defense Management APIs
  async getDefenseSchedules() {
    return this.get('/api/defense/schedules/');
  }

  async createDefenseSchedule(scheduleData: any) {
    return this.post('/api/defense/schedules/', scheduleData);
  }

  async getDefenseSessions() {
    return this.get('/api/defense/sessions/');
  }

  // Analytics APIs
  async getAnalytics() {
    return this.get('/api/analytics/');
  }

  async getProjectStatistics() {
    return this.get('/api/analytics/projects/');
  }

  // Settings APIs
  async getSettings() {
    return this.get('/api/settings/');
  }

  async updateSettings(settings: any) {
    return this.put('/api/settings/', settings);
  }

  // Academic Year APIs
  async getAcademicYears() {
    return this.get('/api/settings/academic-years/');
  }

  async getCurrentAcademicYear() {
    try {
      return await this.get('/api/settings/academic-years/current/');
    } catch (error: any) {
      // Handle 404 - no academic year found
      if (error?.response?.status === 404) {
        // Return empty response instead of throwing error
        return { data: null, status: 404 };
      }
      throw error;
    }
  }

  async getAvailableAcademicYears() {
    return this.get('/api/settings/academic-years/available/');
  }

  async createAcademicYear(yearData: any) {
    return this.post('/api/settings/academic-years/', yearData);
  }

  async updateAcademicYear(id: number, yearData: any) {
    return this.put(`/api/settings/academic-years/${id}/`, yearData);
  }

  async deleteAcademicYear(id: number) {
    return this.delete(`/api/settings/academic-years/${id}/`);
  }

  async activateAcademicYear(id: number) {
    return this.post(`/api/settings/academic-years/${id}/activate/`);
  }

  async createNextAcademicYear() {
    return this.post('/api/settings/academic-years/create_next_year/');
  }

  // Notifications APIs
  async getNotifications(params?: { is_read?: boolean; notification_type?: string; priority?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.is_read !== undefined) queryParams.append('is_read', String(params.is_read));
    if (params?.notification_type) queryParams.append('notification_type', params.notification_type);
    if (params?.priority) queryParams.append('priority', params.priority);
    const query = queryParams.toString();
    return this.get(`/api/notifications/${query ? `?${query}` : ''}`);
  }

  async getNotification(id: number) {
    return this.get(`/api/notifications/${id}/`);
  }

  async createNotification(notificationData: any) {
    return this.post('/api/notifications/', notificationData);
  }

  async updateNotification(id: number, notificationData: any) {
    return this.patch(`/api/notifications/${id}/`, notificationData);
  }

  async markNotificationAsRead(notificationId: number) {
    return this.patch(`/api/notifications/${notificationId}/`, { is_read: true });
  }

  async markNotificationsAsRead(notificationIds: number[]) {
    return this.post('/api/notifications/bulk-update/', {
      notification_ids: notificationIds,
      is_read: true
    });
  }

  async markAllNotificationsAsRead(userId: string) {
    return this.post('/api/notifications/mark-read/', {
      notification_ids: [], // Empty array means mark all for user
      recipient_id: userId
    });
  }

  async deleteNotification(id: number) {
    return this.delete(`/api/notifications/${id}/`);
  }

  async getNotificationStatistics() {
    return this.get('/api/notifications/statistics/');
  }

  async getUserNotifications(userId: string, params?: { is_read?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.is_read !== undefined) queryParams.append('is_read', String(params.is_read));
    const query = queryParams.toString();
    return this.get(`/api/notifications/user/${userId}/${query ? `?${query}` : ''}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
