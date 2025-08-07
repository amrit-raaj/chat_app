import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import { LogoutOutlined, AccountCircle, Brightness4, Brightness7 } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSocket } from '../contexts/SocketContext';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';

const ChatDashboard = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { isConnected } = useSocket();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Chat App
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1">
              Welcome, {user?.username}!
            </Typography>
            
            {/* Connection Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: isConnected ? 'success.main' : 'error.main'
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {isConnected ? 'Connected' : 'Disconnected'}
              </Typography>
            </Box>
            
            <IconButton
              onClick={toggleDarkMode}
              color="inherit"
              aria-label="toggle dark mode"
            >
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              {user?.avatar ? (
                <Avatar src={user.avatar} alt={user.username} sx={{ width: 32, height: 32 }} />
              ) : (
                <AccountCircle />
              )}
            </IconButton>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>Profile</MenuItem>
              <MenuItem onClick={handleClose}>Settings</MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutOutlined sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, display: 'flex', bgcolor: 'background.default' }}>
        {/* Sidebar for conversations */}
        <Box sx={{ 
          width: 350, 
          bgcolor: 'background.paper', 
          borderRight: 1, 
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <ConversationList 
            onSelectConversation={setSelectedConversation}
            selectedConversationId={selectedConversation?._id}
          />
        </Box>

        {/* Main chat area */}
        <ChatWindow conversation={selectedConversation} />
      </Box>
    </Box>
  );
};

export default ChatDashboard;
