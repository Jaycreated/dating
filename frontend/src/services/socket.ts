import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No token found, cannot connect to socket');
      return;
    }

    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.IO server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
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
    if (this.socket) {
      this.socket.emit('join_conversation', matchId);
    }
  }

  leaveConversation(matchId: number) {
    if (this.socket) {
      this.socket.emit('leave_conversation', matchId);
    }
  }

  sendMessage(matchId: number, receiverId: number, content: string) {
    if (this.socket && this.socket.connected) {
      console.log('📤 Sending message:', { matchId, receiverId, content });
      this.socket.emit('send_message', { matchId, receiverId, content });
    } else {
      console.error('❌ Socket not connected. Attempting to reconnect...');
      this.connect();
      // Retry after connection
      setTimeout(() => {
        if (this.socket && this.socket.connected) {
          this.socket.emit('send_message', { matchId, receiverId, content });
        } else {
          console.error('❌ Failed to send message - socket still not connected');
        }
      }, 1000);
    }
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
