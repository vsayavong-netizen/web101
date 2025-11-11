/**
 * WebSocket client for real-time notifications and updates
 */
import { WS_CONFIG } from '../config/api';

export type WebSocketMessage = {
  type: string;
  data: any;
};

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private isConnecting: boolean = false;
  private shouldReconnect: boolean = true;

  constructor(
    url: string = WS_CONFIG.URL,
    reconnectInterval: number = WS_CONFIG.RECONNECT_INTERVAL,
    maxReconnectAttempts: number = WS_CONFIG.MAX_RECONNECT_ATTEMPTS
  ) {
    this.url = url;
    this.reconnectInterval = reconnectInterval;
    this.maxReconnectAttempts = maxReconnectAttempts;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token?: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        // Build WebSocket URL with authentication
        let wsUrl = this.url;
        if (token) {
          const separator = wsUrl.includes('?') ? '&' : '?';
          wsUrl = `${wsUrl}${separator}token=${encodeURIComponent(token)}`;
        }

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnecting = false;
          this.ws = null;

          // Attempt to reconnect if needed
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(token);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(token?: string): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    console.log(`Scheduling WebSocket reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(token).catch((error) => {
        console.error('WebSocket reconnection failed:', error);
      });
    }, this.reconnectInterval);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.shouldReconnect = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send message to WebSocket server
   */
  send(action: string, data?: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, ...data }));
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    // Call all handlers for this message type
    const handlers = this.eventHandlers.get(message.type) || [];
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in WebSocket event handler:', error);
      }
    });

    // Also call 'message' handlers for all messages
    const allHandlers = this.eventHandlers.get('message') || [];
    allHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in WebSocket message handler:', error);
      }
    });
  }

  /**
   * Subscribe to specific message types
   */
  on(messageType: string, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(messageType)) {
      this.eventHandlers.set(messageType, []);
    }
    this.eventHandlers.get(messageType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Unsubscribe from message type
   */
  off(messageType: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// Create singleton instance
let wsClientInstance: WebSocketClient | null = null;

export const getWebSocketClient = (): WebSocketClient => {
  if (!wsClientInstance) {
    wsClientInstance = new WebSocketClient();
  }
  return wsClientInstance;
};

export default WebSocketClient;

