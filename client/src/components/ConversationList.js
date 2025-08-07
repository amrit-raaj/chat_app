import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Badge,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Divider
} from '@mui/material';
import { Add, Search, Person } from '@mui/icons-material';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

const ConversationList = ({ onSelectConversation, selectedConversationId }) => {
  const [conversations, setConversations] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { onlineUsers, socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    fetchConversations();
  }, []);

  // Update conversations when a conversation is selected (to refresh unread counts)
  useEffect(() => {
    if (selectedConversationId) {
      // Refresh conversations after a short delay to allow messages to be marked as read
      const timer = setTimeout(() => {
        fetchConversations();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedConversationId]);

  // Listen for socket events to update conversations in real-time
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message) => {
        // Refresh conversations when a new message arrives
        fetchConversations();
      };

      const handleMessageRead = () => {
        // Refresh conversations when messages are marked as read
        fetchConversations();
      };

      socket.on('new_message', handleNewMessage);
      socket.on('messages_read', handleMessageRead);

      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('messages_read', handleMessageRead);
      };
    }
  }, [socket]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/conversations');
      if (response.data.success) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const searchUsers = async (query) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/conversations/search-users?query=${encodeURIComponent(query)}`);
      if (response.data.success) {
        setSearchResults(response.data.users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDirectConversation = async (userId) => {
    try {
      const response = await axios.post('/conversations/direct', { userId });
      if (response.data.success) {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        await fetchConversations();
        onSelectConversation(response.data.conversation);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const formatLastSeen = (lastSeen) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getConversationName = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    // For direct conversations, show the other participant's name
    if (!user?._id || !conversation.participants) {
      return 'Unknown User';
    }
    
    const otherParticipant = conversation.participants.find(p => 
      p && p._id && p._id.toString() !== user._id.toString()
    );
    
    return otherParticipant?.username || 'Unknown User';
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.avatar || '';
    }
    if (!user?._id || !conversation.participants) return '';
    const otherParticipant = conversation.participants.find(p => 
      p && p._id && p._id.toString() !== user._id.toString()
    );
    return otherParticipant?.avatar || '';
  };

  const isUserOnline = (conversation) => {
    if (conversation.type === 'group') return false;
    if (!user?._id || !conversation.participants) return false;
    const otherParticipant = conversation.participants.find(p => 
      p && p._id && p._id.toString() !== user._id.toString()
    );
    return otherParticipant && onlineUsers.has(otherParticipant._id);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Conversations</Typography>
          <IconButton onClick={() => setSearchOpen(true)} size="small">
            <Add />
          </IconButton>
        </Box>
      </Box>

      {/* Conversation List */}
      <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
        {conversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No conversations yet. Start a new chat!
            </Typography>
          </Box>
        ) : (
          conversations.map((conversation) => (
            <ListItem
              key={conversation._id}
              button
              selected={selectedConversationId === conversation._id}
              onClick={() => onSelectConversation(conversation)}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                }
              }}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  color={isUserOnline(conversation) ? 'success' : 'default'}
                  invisible={!isUserOnline(conversation)}
                >
                  <Avatar src={getConversationAvatar(conversation)}>
                    {getConversationName(conversation).charAt(0).toUpperCase()}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" noWrap>
                      {getConversationName(conversation)}
                    </Typography>
                    {conversation.unreadCount > 0 && (
                      <Chip
                        label={conversation.unreadCount}
                        size="small"
                        color="primary"
                        sx={{ minWidth: 20, height: 20, fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {conversation.lastMessage?.content || 'No messages yet'}
                  </Typography>
                }
              />
            </ListItem>
          ))
        )}
      </List>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start New Conversation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Search users by username or email"
            fullWidth
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          {searchResults.length > 0 && (
            <List sx={{ mt: 2 }}>
              {searchResults.map((user) => (
                <ListItem
                  key={user._id}
                  button
                  onClick={() => createDirectConversation(user._id)}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      color={onlineUsers.has(user._id) ? 'success' : 'default'}
                      invisible={!onlineUsers.has(user._id)}
                    >
                      <Avatar src={user.avatar}>
                        {user.username.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.username}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {onlineUsers.has(user._id) ? 'Online' : `Last seen ${formatLastSeen(user.lastSeen)}`}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
          
          {searchQuery.length >= 2 && searchResults.length === 0 && !loading && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              No users found
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConversationList;
