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

  constructor(baseURL: string = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || (typeof window !== 'undefined' && (window as any).__API_BASE_URL) || 'https://eduinfo.online') {
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

    if (this.token) {
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
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
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

      if (response.status === 401 && this.refreshToken) {
        // Attempt token refresh once
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
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
        } else {
          this.clearToken();
          // Notify global handler if exists
          if (typeof window !== 'undefined' && (window as any).onAuthExpired) {
            try { (window as any).onAuthExpired(); } catch {}
          }
        }
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
    if (!this.refreshToken) return false;
    try {
      const res = await fetch(`${this.baseURL}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.refreshToken }),
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
      
      if (apiError.status === 401) {
        errorMessage = 'Invalid username or password';
      } else if (apiError.status === 400) {
        errorMessage = 'Please enter both username and password';
      } else if (apiError.status === 500) {
        errorMessage = 'Server error, please try again later';
      }
      
      throw {
        message: errorMessage,
        status: apiError.status || 500,
        details: apiError
      };
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
  async getProjects() {
    return this.get('/api/projects/');
  }

  async createProject(projectData: any) {
    return this.post('/api/projects/', projectData);
  }

  async updateProject(id: string, projectData: any) {
    return this.put(`/api/projects/${id}/`, projectData);
  }

  async deleteProject(id: string) {
    return this.delete(`/api/projects/${id}/`);
  }

  // Student Management APIs
  async getStudents() {
    return this.get('/api/students/');
  }

  async createStudent(studentData: any) {
    return this.post('/api/students/', studentData);
  }

  async updateStudent(id: string, studentData: any) {
    return this.put(`/api/students/${id}/`, studentData);
  }

  // Advisor Management APIs
  async getAdvisors() {
    return this.get('/api/advisors/');
  }

  async createAdvisor(advisorData: any) {
    return this.post('/api/advisors/', advisorData);
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

  // Notifications APIs
  async getNotifications() {
    return this.get('/api/notifications/');
  }

  async markNotificationAsRead(notificationId: string) {
    return this.patch(`/api/notifications/${notificationId}/`, { read: true });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
