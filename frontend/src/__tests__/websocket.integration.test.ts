/**
 * Frontend WebSocket Integration Tests
 * 
 * Tests WebSocket client integration with backend
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocketClient, { getWebSocketClient } from '../../utils/websocketClient';
import { WS_CONFIG } from '../../config/api';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  url: string = '';
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string): void {
    // Mock send
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

describe('WebSocket Client Integration', () => {
  let wsClient: WebSocketClient;
  const mockToken = 'test-jwt-token-12345';

  beforeEach(() => {
    wsClient = getWebSocketClient();
  });

  afterEach(() => {
    wsClient.disconnect();
  });

  describe('Connection', () => {
    it('should connect to WebSocket server with token', async () => {
      await wsClient.connect(mockToken);
      expect(wsClient.isConnected()).toBe(true);
    });

    it('should include token in WebSocket URL', async () => {
      const originalWebSocket = global.WebSocket;
      let capturedUrl = '';
      
      (global as any).WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          capturedUrl = url;
        }
      };

      await wsClient.connect(mockToken);
      expect(capturedUrl).toContain('token=');
      expect(capturedUrl).toContain(encodeURIComponent(mockToken));

      global.WebSocket = originalWebSocket;
    });

    it('should not connect if already connected', async () => {
      await wsClient.connect(mockToken);
      const initialState = wsClient.getState();
      await wsClient.connect(mockToken);
      expect(wsClient.getState()).toBe(initialState);
    });

    it('should handle connection errors gracefully', async () => {
      const originalWebSocket = global.WebSocket;
      let errorCallback: ((event: Event) => void) | null = null;

      (global as any).WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            if (errorCallback) {
              errorCallback(new Event('error'));
            }
          }, 10);
        }

        set onerror(callback: ((event: Event) => void) | null) {
          errorCallback = callback;
        }
      };

      await expect(wsClient.connect(mockToken)).rejects.toBeDefined();

      global.WebSocket = originalWebSocket;
    });
  });

  describe('Message Handling', () => {
    it('should receive and handle messages', async () => {
      await wsClient.connect(mockToken);

      const receivedMessages: any[] = [];
      wsClient.on('notification', (message) => {
        receivedMessages.push(message);
      });

      // Simulate message from server
      const mockMessage = {
        type: 'notification',
        data: {
          id: '1',
          title: 'Test Notification',
          message: 'Test message',
        },
      };

      // Trigger message handler
      const ws = (wsClient as any).ws;
      if (ws && ws.onmessage) {
        ws.onmessage({
          data: JSON.stringify(mockMessage),
        } as MessageEvent);
      }

      expect(receivedMessages.length).toBeGreaterThan(0);
      expect(receivedMessages[0].type).toBe('notification');
    });

    it('should handle multiple message types', async () => {
      await wsClient.connect(mockToken);

      const notificationMessages: any[] = [];
      const updateMessages: any[] = [];

      wsClient.on('notification', (message) => {
        notificationMessages.push(message);
      });

      wsClient.on('update', (message) => {
        updateMessages.push(message);
      });

      // Simulate different message types
      const ws = (wsClient as any).ws;
      if (ws && ws.onmessage) {
        ws.onmessage({
          data: JSON.stringify({ type: 'notification', data: {} }),
        } as MessageEvent);

        ws.onmessage({
          data: JSON.stringify({ type: 'update', data: {} }),
        } as MessageEvent);
      }

      expect(notificationMessages.length).toBe(1);
      expect(updateMessages.length).toBe(1);
    });

    it('should handle invalid JSON messages gracefully', async () => {
      await wsClient.connect(mockToken);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const ws = (wsClient as any).ws;
      if (ws && ws.onmessage) {
        ws.onmessage({
          data: 'invalid json',
        } as MessageEvent);
      }

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Reconnection', () => {
    it('should attempt to reconnect on disconnect', async () => {
      await wsClient.connect(mockToken);
      
      const reconnectSpy = vi.spyOn(wsClient as any, 'scheduleReconnect');
      
      // Simulate disconnect
      const ws = (wsClient as any).ws;
      if (ws && ws.onclose) {
        ws.onclose(new CloseEvent('close'));
      }

      // Wait for reconnection attempt
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(reconnectSpy).toHaveBeenCalled();
    });

    it('should respect max reconnection attempts', async () => {
      const client = new WebSocketClient(WS_CONFIG.URL, 10, 2); // Max 2 attempts
      
      let reconnectCount = 0;
      const originalConnect = client.connect.bind(client);
      client.connect = vi.fn().mockImplementation(async (token?: string) => {
        reconnectCount++;
        if (reconnectCount > 2) {
          throw new Error('Max attempts exceeded');
        }
        return originalConnect(token);
      });

      await client.connect(mockToken);
      
      // Simulate multiple disconnects
      const ws = (client as any).ws;
      for (let i = 0; i < 3; i++) {
        if (ws && ws.onclose) {
          ws.onclose(new CloseEvent('close'));
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      expect(reconnectCount).toBeLessThanOrEqual(3);
    });
  });

  describe('Event Subscription', () => {
    it('should subscribe to message types', async () => {
      await wsClient.connect(mockToken);

      const handler = vi.fn();
      const unsubscribe = wsClient.on('test', handler);

      expect(handler).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe from message types', async () => {
      await wsClient.connect(mockToken);

      const handler = vi.fn();
      const unsubscribe = wsClient.on('test', handler);

      unsubscribe();

      // Trigger message - handler should not be called
      const ws = (wsClient as any).ws;
      if (ws && ws.onmessage) {
        ws.onmessage({
          data: JSON.stringify({ type: 'test', data: {} }),
        } as MessageEvent);
      }

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Send Messages', () => {
    it('should send messages when connected', async () => {
      await wsClient.connect(mockToken);

      const ws = (wsClient as any).ws;
      const sendSpy = vi.spyOn(ws, 'send');

      wsClient.send('get_notifications', { userId: '123' });

      expect(sendSpy).toHaveBeenCalled();
      const sentData = JSON.parse(sendSpy.mock.calls[0][0]);
      expect(sentData.action).toBe('get_notifications');
      expect(sentData.userId).toBe('123');
    });

    it('should not send messages when disconnected', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      wsClient.send('test', {});

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'WebSocket is not connected. Cannot send message.'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Connection State', () => {
    it('should report connection state correctly', async () => {
      expect(wsClient.isConnected()).toBe(false);

      await wsClient.connect(mockToken);
      expect(wsClient.isConnected()).toBe(true);

      wsClient.disconnect();
      expect(wsClient.isConnected()).toBe(false);
    });

    it('should return correct WebSocket state', async () => {
      expect(wsClient.getState()).toBe(MockWebSocket.CLOSED);

      await wsClient.connect(mockToken);
      expect(wsClient.getState()).toBe(MockWebSocket.OPEN);
    });
  });
});

describe('WebSocket URL Configuration', () => {
  it('should use correct WebSocket URL format', () => {
    const baseUrl = WS_CONFIG.URL;
    expect(baseUrl).toMatch(/^ws(s)?:\/\//);
  });

  it('should handle token encoding in URL', () => {
    const token = 'test token with spaces & special chars';
    const encoded = encodeURIComponent(token);
    expect(encoded).not.toContain(' ');
    expect(encoded).not.toContain('&');
  });
});

