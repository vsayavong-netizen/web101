/**
 * Hook for managing Notifications using Backend API
 * Replaces localStorage-based notification system
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../utils/apiClient';
import { useToast } from './useToast';
import { Notification } from '../types';
import { getWebSocketClient } from '../utils/websocketClient';
import { WS_CONFIG } from '../config/api';

export const useNotifications = (userId?: string, academicYear?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const addToast = useToast();
  const wsClientRef = useRef<any>(null);
  const unsubscribeRef = useRef<Array<() => void>>([]);

  /**
   * Load notifications from Backend API
   */
  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to get from Backend API
      // First try user-specific endpoint, fallback to general list
      let response;
      try {
        response = await apiClient.getUserNotifications(userId);
      } catch (err) {
        // Fallback to general notifications list
        response = await apiClient.getNotifications();
      }
      
      if (response.data && response.data.notifications) {
        // Map backend notification format to frontend format
        const mappedNotifications = response.data.notifications.map((n: any) => ({
          id: String(n.id),
          title: n.title,
          message: n.message,
          type: n.notification_type || 'System',
          userIds: n.recipient_type === 'all' ? ['all'] : [n.recipient_id],
          projectId: n.action_url?.includes('/projects/') 
            ? n.action_url.split('/projects/')[1]?.split('/')[0] 
            : '',
          timestamp: n.created_at,
          read: n.is_read,
          actionUrl: n.action_url,
          actionText: n.action_text,
        }));
        
        setNotifications(mappedNotifications);
      } else if (Array.isArray(response.data)) {
        // Handle direct array response
        const mappedNotifications = response.data.map((n: any) => ({
          id: String(n.id),
          title: n.title,
          message: n.message,
          type: n.notification_type || 'System',
          userIds: n.recipient_type === 'all' ? ['all'] : [n.recipient_id],
          projectId: n.action_url?.includes('/projects/') 
            ? n.action_url.split('/projects/')[1]?.split('/')[0] 
            : '',
          timestamp: n.created_at,
          read: n.is_read,
          actionUrl: n.action_url,
          actionText: n.action_text,
        }));
        
        setNotifications(mappedNotifications);
      }
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setError(err.message || 'Failed to load notifications');
      
      // Fallback to localStorage if API fails
      if (academicYear) {
        const stored = localStorage.getItem(`notifications_${academicYear}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setNotifications(parsed);
          } catch (e) {
            console.error('Failed to parse stored notifications:', e);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [userId, academicYear]);

  /**
   * Add a new notification
   */
  const addNotification = useCallback(async (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!userId) return;

    try {
      // Create notification via Backend API
      const response = await apiClient.createNotification({
        title: notificationData.title,
        message: notificationData.message,
        notification_type: notificationData.type?.toLowerCase() || 'system',
        priority: 'medium',
        recipient_id: notificationData.userIds?.[0] || userId,
        recipient_type: notificationData.userIds?.includes('all') ? 'all' : 'user',
        action_url: notificationData.actionUrl || '',
        action_text: notificationData.actionText || '',
      });

      if (response.data) {
        // Map backend response to frontend format
        const newNotification: Notification = {
          id: String(response.data.id),
          title: response.data.title,
          message: response.data.message,
          type: response.data.notification_type || 'System',
          userIds: response.data.recipient_type === 'all' ? ['all'] : [response.data.recipient_id],
          projectId: notificationData.projectId || '',
          timestamp: response.data.created_at || new Date().toISOString(),
          read: false,
          actionUrl: response.data.action_url,
          actionText: response.data.action_text,
        };

        setNotifications(prev => [newNotification, ...prev]);
      }
    } catch (err: any) {
      console.error('Failed to create notification:', err);
      
      // Fallback: add to local state and localStorage
      const newNotification: Notification = {
        id: `local_${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
        ...notificationData,
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      // Save to localStorage as backup
      if (academicYear) {
        const stored = localStorage.getItem(`notifications_${academicYear}`);
        const existing = stored ? JSON.parse(stored) : [];
        localStorage.setItem(`notifications_${academicYear}`, JSON.stringify([newNotification, ...existing]));
      }
    }
  }, [userId, academicYear]);

  /**
   * Mark notifications as read
   */
  const markNotificationsAsRead = useCallback(async (targetUserId: string) => {
    if (!userId) return;

    try {
      // Get unread notifications for this user
      const unreadIds = notifications
        .filter(n => n.userIds.includes(targetUserId) && !n.read)
        .map(n => parseInt(n.id))
        .filter(id => !isNaN(id));

      if (unreadIds.length > 0) {
        await apiClient.markNotificationsAsRead(unreadIds);
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.userIds.includes(targetUserId) && !n.read
            ? { ...n, read: true }
            : n
        )
      );
    } catch (err: any) {
      console.error('Failed to mark notifications as read:', err);
      
      // Fallback: update local state only
      setNotifications(prev =>
        prev.map(n =>
          n.userIds.includes(targetUserId) && !n.read
            ? { ...n, read: true }
            : n
        )
      );
      
      // Save to localStorage as backup
      if (academicYear) {
        localStorage.setItem(`notifications_${academicYear}`, JSON.stringify(notifications));
      }
    }
  }, [notifications, userId, academicYear]);

  /**
   * Mark single notification as read
   */
  const markSingleNotificationAsRead = useCallback(async (notificationId: string) => {
    const numId = parseInt(notificationId);
    
    if (!isNaN(numId)) {
      try {
        await apiClient.markNotificationAsRead(numId);
      } catch (err: any) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    // Update local state
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );

    // Save to localStorage as backup
    if (academicYear) {
      localStorage.setItem(`notifications_${academicYear}`, JSON.stringify(notifications));
    }
  }, [notifications, academicYear]);

  /**
   * Setup WebSocket connection for real-time notifications
   */
  useEffect(() => {
    if (!userId) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      return;
    }

    // Get WebSocket client instance with error handling
    let wsClient;
    try {
      wsClient = getWebSocketClient();
      if (!wsClient) {
        console.warn('WebSocket client not available');
        return;
      }
    } catch (error) {
      console.error('Failed to get WebSocket client:', error);
      return;
    }
    
    wsClientRef.current = wsClient;

    // Connect to notifications WebSocket
    const connectWebSocket = async () => {
      try {
        // Build WebSocket URL for notifications
        const wsUrl = `${WS_CONFIG.URL.replace('/ws/', '/ws/notifications/')}`;
        wsClient.url = wsUrl;
        
        await wsClient.connect(token);

        // Subscribe to notification messages
        const unsubscribeNotification = wsClient.on('notification', (message) => {
          const notificationData = message.data;
          
          // Map backend notification format to frontend format
          const newNotification: Notification = {
            id: String(notificationData.id),
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type || 'System',
            userIds: notificationData.recipient_type === 'all' ? ['all'] : [notificationData.recipient_id],
            projectId: notificationData.action_url?.includes('/projects/')
              ? notificationData.action_url.split('/projects/')[1]?.split('/')[0]
              : '',
            timestamp: notificationData.timestamp || new Date().toISOString(),
            read: notificationData.read || false,
            actionUrl: notificationData.action_url,
            actionText: notificationData.action_text,
          };

          // Add notification to state
          setNotifications(prev => {
            // Check if notification already exists
            const exists = prev.some(n => n.id === newNotification.id);
            if (exists) {
              return prev;
            }
            return [newNotification, ...prev];
          });

          // Show toast notification
          addToast({
            type: notificationData.type === 'error' ? 'error' : 
                  notificationData.type === 'warning' ? 'warning' :
                  notificationData.type === 'success' ? 'success' : 'info',
            message: notificationData.title || notificationData.message,
          });
        });

        // Subscribe to notifications list updates
        const unsubscribeList = wsClient.on('notifications_list', (message) => {
          const notificationsData = message.data;
          
          if (Array.isArray(notificationsData)) {
            const mappedNotifications = notificationsData.map((n: any) => ({
              id: String(n.id),
              title: n.title,
              message: n.message,
              type: n.type || 'System',
              userIds: n.recipient_type === 'all' ? ['all'] : [n.recipient_id],
              projectId: n.action_url?.includes('/projects/')
                ? n.action_url.split('/projects/')[1]?.split('/')[0]
                : '',
              timestamp: n.timestamp || new Date().toISOString(),
              read: n.read || false,
              actionUrl: n.action_url,
              actionText: n.action_text,
            }));

            setNotifications(mappedNotifications);
          }
        });

        unsubscribeRef.current = [unsubscribeNotification, unsubscribeList];
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      unsubscribeRef.current.forEach(unsubscribe => unsubscribe());
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
      }
    };
  }, [userId, addToast]);

  // Load notifications on mount and when userId/academicYear changes
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Sync to localStorage as backup when notifications change
  useEffect(() => {
    if (academicYear && notifications.length > 0) {
      try {
        localStorage.setItem(`notifications_${academicYear}`, JSON.stringify(notifications));
      } catch (e) {
        console.error('Failed to save notifications to localStorage:', e);
      }
    }
  }, [notifications, academicYear]);

  return {
    notifications,
    loading,
    error,
    addNotification,
    markNotificationsAsRead,
    markSingleNotificationAsRead,
    reloadNotifications: loadNotifications,
  };
};

