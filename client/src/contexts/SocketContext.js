import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Create socket connection
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0]
        },
        withCredentials: true
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // User status event handlers
      newSocket.on('user_online', (data) => {
        setOnlineUsers(prev => new Set([...prev, data.userId]));
      });

      newSocket.on('user_offline', (data) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
      };
    } else {
      // Clean up socket when user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
      }
    }
  }, [isAuthenticated, user]);

  // Socket utility functions
  const joinConversation = (conversationId) => {
    if (socket) {
      socket.emit('join_conversation', conversationId);
    }
  };

  const leaveConversation = (conversationId) => {
    if (socket) {
      socket.emit('leave_conversation', conversationId);
    }
  };

  const sendMessage = (messageData) => {
    if (socket) {
      socket.emit('send_message', messageData);
    }
  };

  const startTyping = (conversationId) => {
    if (socket) {
      socket.emit('typing_start', { conversationId });
    }
  };

  const stopTyping = (conversationId) => {
    if (socket) {
      socket.emit('typing_stop', { conversationId });
    }
  };

  const addReaction = (messageId, emoji) => {
    if (socket) {
      socket.emit('add_reaction', { messageId, emoji });
    }
  };

  const editMessage = (messageId, content) => {
    if (socket) {
      socket.emit('edit_message', { messageId, content });
    }
  };

  const deleteMessage = (messageId) => {
    if (socket) {
      socket.emit('delete_message', { messageId });
    }
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    addReaction,
    editMessage,
    deleteMessage
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
