import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Paper,
  Chip,
  CircularProgress,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress
} from '@mui/material';
import { Send, AttachFile, EmojiEmotions, Image, Close } from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

const ChatWindow = ({ conversation }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { socket, joinConversation, leaveConversation, sendMessage, startTyping, stopTyping } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      joinConversation(conversation._id);

      // Socket event listeners
      if (socket) {
        socket.on('new_message', handleNewMessage);
        socket.on('user_typing', handleUserTyping);
        socket.on('user_stop_typing', handleUserStopTyping);
        socket.on('message_edited', handleMessageEdited);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('message_reaction', handleMessageReaction);
      }

      return () => {
        if (conversation) {
          leaveConversation(conversation._id);
        }
        if (socket) {
          socket.off('new_message', handleNewMessage);
          socket.off('user_typing', handleUserTyping);
          socket.off('user_stop_typing', handleUserStopTyping);
          socket.off('message_edited', handleMessageEdited);
          socket.off('message_deleted', handleMessageDeleted);
          socket.off('message_reaction', handleMessageReaction);
        }
      };
    }
  }, [conversation, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!conversation) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/messages/${conversation._id}`);
      if (response.data.success) {
        setMessages(response.data.messages);
        // Emit event to update conversation list (messages are marked as read by the API)
        if (socket) {
          socket.emit('messages_read', { conversationId: conversation._id });
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    if (message.conversation === conversation._id) {
      setMessages(prev => [...prev, message]);
    }
  };

  const handleUserTyping = (data) => {
    if (data.conversationId === conversation._id && data.userId !== user._id) {
      setTypingUsers(prev => new Set([...prev, data.username]));
    }
  };

  const handleUserStopTyping = (data) => {
    if (data.conversationId === conversation._id) {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.username);
        return newSet;
      });
    }
  };

  const handleMessageEdited = (editedMessage) => {
    setMessages(prev => prev.map(msg => 
      msg._id === editedMessage._id ? editedMessage : msg
    ));
  };

  const handleMessageDeleted = (data) => {
    setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
  };

  const handleMessageReaction = (data) => {
    setMessages(prev => prev.map(msg => 
      msg._id === data.messageId ? { ...msg, reactions: data.reactions } : msg
    ));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !conversation) return;

    const messageData = {
      conversationId: conversation._id,
      content: newMessage.trim(),
      type: 'text'
    };

    sendMessage(messageData);
    setNewMessage('');
    stopTyping(conversation._id);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicators
    if (conversation) {
      startTyping(conversation._id);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(conversation._id);
      }, 1000);
    }
  };

  // Emoji picker handlers
  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setEmojiAnchorEl(null);
  };

  const handleEmojiButtonClick = (event) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setEmojiAnchorEl(null);
  };

  // Image upload handlers
  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      setImageDialogOpen(true);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage || !conversation) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('conversationId', conversation._id);

      const response = await axios.post('/messages/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      if (response.data.success) {
        // Send image message via socket
        const messageData = {
          conversationId: conversation._id,
          content: response.data.imageUrl,
          type: 'image'
        };
        sendMessage(messageData);
        
        handleImageDialogClose();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImageDialogClose = () => {
    setImageDialogOpen(false);
    setSelectedImage(null);
    setImagePreview('');
    setUploadProgress(0);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getConversationName = () => {
    if (!conversation) return '';
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    if (!user?._id || !conversation.participants) return 'Unknown User';
    const otherParticipant = conversation.participants.find(p => 
      p && p._id && p._id.toString() !== user._id.toString()
    );
    return otherParticipant?.username || 'Unknown User';
  };

  const getConversationAvatar = () => {
    if (!conversation) return '';
    if (conversation.type === 'group') {
      return conversation.avatar || '';
    }
    if (!user?._id || !conversation.participants) return '';
    const otherParticipant = conversation.participants.find(p => 
      p && p._id && p._id.toString() !== user._id.toString()
    );
    return otherParticipant?.avatar || '';
  };

  if (!conversation) {
    return (
      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Select a conversation to start chatting
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Chat Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={getConversationAvatar()} sx={{ mr: 2 }}>
            {getConversationName().charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6">{getConversationName()}</Typography>
            <Typography variant="body2" color="text.secondary">
              {conversation.participants.length} participants
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {messages.map((message) => (
              <Box
                key={message._id}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender._id === user._id ? 'flex-end' : 'flex-start',
                  mb: 1
                }}
              >
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: '70%',
                    bgcolor: message.sender._id === user._id ? 'primary.main' : 'background.paper',
                    color: message.sender._id === user._id ? 'primary.contrastText' : 'text.primary'
                  }}
                >
                  {message.sender._id !== user._id && (
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                      {message.sender.username}
                    </Typography>
                  )}
                  {message.type === 'image' ? (
                    <Box sx={{ mt: 1 }}>
                      <img
                        src={`http://localhost:5000${message.content}`}
                        alt="Shared image"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '300px',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(`http://localhost:5000${message.content}`, '_blank')}
                        onLoad={() => {
                          console.log('Image loaded successfully:', `http://localhost:5000${message.content}`);
                        }}
                        onError={(e) => {
                          console.error('Image failed to load:', `http://localhost:5000${message.content}`);
                          console.error('Original content:', message.content);
                          // Show a placeholder instead of hiding
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                    </Box>
                  ) : (
                    <Typography variant="body1">{message.content}</Typography>
                  )}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      textAlign: 'right', 
                      mt: 0.5,
                      opacity: 0.7
                    }}
                  >
                    {formatMessageTime(message.createdAt)}
                    {message.edited?.isEdited && ' (edited)'}
                  </Typography>
                </Paper>
              </Box>
            ))}
            
            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                <Chip
                  label={`${Array.from(typingUsers).join(', ')} ${typingUsers.size === 1 ? 'is' : 'are'} typing...`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <IconButton color="primary" onClick={handleImageButtonClick}>
            <Image />
          </IconButton>
          <IconButton color="primary" onClick={handleEmojiButtonClick}>
            <EmojiEmotions />
          </IconButton>
          <IconButton 
            color="primary" 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Send />
          </IconButton>
        </Box>
      </Box>

      {/* Emoji Picker Popover */}
      <Popover
        open={Boolean(emojiAnchorEl)}
        anchorEl={emojiAnchorEl}
        onClose={handleEmojiClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          width={350}
          height={400}
        />
      </Popover>

      {/* Image Upload Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={handleImageDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Send Image
            <IconButton onClick={handleImageDialogClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {imagePreview && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  borderRadius: '8px'
                }}
              />
            </Box>
          )}
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Uploading... {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImageDialogClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleImageUpload}
            variant="contained"
            disabled={!selectedImage || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <Send />}
          >
            {uploading ? 'Uploading...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatWindow;
