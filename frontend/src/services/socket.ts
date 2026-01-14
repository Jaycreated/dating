import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL;


class SocketService {
  private socket: Socket | null = null;

  connect() {
    console.log('🔌 Attempting to connect to WebSocket...');
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ No authentication token found, cannot connect to WebSocket');
      return;
    }

    if (this.socket?.connected) {
      console.log('ℹ️ WebSocket already connected');
      return;
    }

    console.log(`🌐 Initializing WebSocket connection to: ${SOCKET_URL}`);
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Successfully connected to WebSocket server');
      console.log(`🔗 Socket ID: ${this.socket?.id}`);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`❌ Disconnected from WebSocket. Reason: ${reason}`);
      if (reason === 'io server disconnect') {
        console.log('ℹ️ Server initiated disconnection');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      console.error('Error details:', error);
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}/5`);
    });

    this.socket.on('reconnect', (attempt) => {
      console.log(`♻️ Successfully reconnected after ${attempt} attempts`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect after maximum attempts');
    });

    this.socket.on('message_error', (data) => {
      console.error('❌ Message error:', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(matchId: number) {
    if (!this.socket || !this.socket.connected) {
      console.error('❌ Cannot join conversation - socket not connected');
      this.connect();
      return;
    }
    
    console.log(`🔵 Joining conversation room: ${matchId}`);
    this.socket.emit('join_conversation', matchId, (response: any) => {
      if (response && response.error) {
        console.error('❌ Failed to join conversation:', response.error);
      } else {
        console.log(`✅ Successfully joined conversation room: ${matchId}`);
      }
    });
  }

  leaveConversation(matchId: number) {
    if (this.socket) {
      this.socket.emit('leave_conversation', matchId);
    }
  }

  sendMessage(matchId: number, receiverId: number, content: string) {
    if (!this.socket || !this.socket.connected) {
      console.error('❌ Socket not connected. Attempting to reconnect...');
      this.connect();
      // Retry after connection
      setTimeout(() => {
        if (this.socket && this.socket.connected) {
          this.socket.emit('send_message', { matchId, receiverId, content }, (response: any) => {
            if (response && response.error) {
              console.error('❌ Failed to send message:', response.error);
            } else {
              console.log('✅ Message sent successfully');
            }
          });
        } else {
          console.error('❌ Failed to send message - socket still not connected');
        }
      }, 1000);
      return;
    }

    console.log('📤 Sending message:', { matchId, receiverId, content });
    this.socket.emit('send_message', { matchId, receiverId, content }, (response: any) => {
      if (response && response.error) {
        console.error('❌ Failed to send message:', response.error);
      } else {
        console.log('✅ Message sent successfully');
      }
    });
  }

  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  offNewMessage() {
    if (this.socket) {
      this.socket.off('new_message');
    }
  }

  onMessageNotification(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('message_notification', callback);
    }
  }

  offMessageNotification() {
    if (this.socket) {
      this.socket.off('message_notification');
    }
  }

  sendTyping(matchId: number, receiverId: number) {
    if (this.socket) {
      this.socket.emit('typing', { matchId, receiverId });
    }
  }

  sendStopTyping(matchId: number, receiverId: number) {
    if (this.socket) {
      this.socket.emit('stop_typing', { matchId, receiverId });
    }
  }

  onUserTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  offUserTyping() {
    if (this.socket) {
      this.socket.off('user_typing');
    }
  }

  onUserStopTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_stop_typing', callback);
    }
  }

  offUserStopTyping() {
    if (this.socket) {
      this.socket.off('user_stop_typing');
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
