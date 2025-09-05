import { io } from 'socket.io-client';
import { auth } from '../config/firebase';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentRooms = new Set();
  }

  connect() {
    if (!this.socket) {
      // For local development - adjust URL as needed
      this.socket = io('http://localhost:5000', {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        timeout: 5000,
        auth: {
          token: auth.currentUser?.accessToken
        }
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to Socket.IO server');
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from Socket.IO server:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection error:', error);
        // Silently fail - Firestore real-time listeners will handle messaging
      });
    }

    if (auth.currentUser && !this.socket.connected) {
      try {
        this.socket.connect();
      } catch (error) {
        console.log('Socket.IO connection failed, using Firestore fallback:', error);
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.currentRooms.clear();
    }
  }

  joinCrew(crewId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_crew', crewId);
      this.currentRooms.add(crewId);
      console.log(`📡 Joined crew room: ${crewId}`);
    } else {
      console.log('⚠️ Socket not connected, cannot join crew room');
    }
  }

  leaveCrew(crewId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_crew', crewId);
      this.currentRooms.delete(crewId);
      console.log(`📡 Left crew room: ${crewId}`);
    }
  }

  sendMessage(messageData) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send_message', messageData);
      console.log('📡 Message sent via Socket.IO:', messageData);
    } else {
      console.log('⚠️ Socket not connected, message will be sent via Firestore only');
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onMessageUpdate(callback) {
    if (this.socket) {
      this.socket.on('message_updated', callback);
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('user_joined', callback);
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('user_left', callback);
    }
  }

  offAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const socketService = new SocketService();
export default socketService;
