const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');

// Import socket handlers
const { socketAuth } = require('./middleware/auth');
const User = require('./models/User');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Socket.io connection handling
io.use(socketAuth);

io.on('connection', async (socket) => {
  console.log(`User ${socket.user.username} connected with socket ID: ${socket.id}`);
  
  try {
    // Update user online status and socket ID
    await socket.user.setOnlineStatus(true, socket.id);
    
    // Join user to their personal room
    socket.join(socket.user._id.toString());
    
    // Broadcast user online status to all connected clients
    socket.broadcast.emit('user_online', {
      userId: socket.user._id,
      username: socket.user.username,
      isOnline: true
    });

    // Handle joining conversation rooms
    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.user.username} joined conversation: ${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${socket.user.username} left conversation: ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, type = 'text', replyTo } = data;

        if (!conversationId || !content || content.trim() === '') {
          socket.emit('message_error', { error: 'Invalid message data' });
          return;
        }

        // Check if conversation exists and user is a participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit('message_error', { error: 'Conversation not found' });
          return;
        }

        const isParticipant = conversation.participants.includes(socket.user._id);
        if (!isParticipant) {
          socket.emit('message_error', { error: 'Not authorized to send messages' });
          return;
        }

        // Create message
        const messageData = {
          conversation: conversationId,
          sender: socket.user._id,
          content: content.trim(),
          type
        };

        if (replyTo) {
          messageData.replyTo = replyTo;
        }

        const message = await Message.create(messageData);

        // Populate sender information
        await message.populate('sender', 'username avatar');
        if (replyTo) {
          await message.populate('replyTo', 'content sender type');
        }

        // Update conversation's last message and activity
        conversation.lastMessage = message._id;
        await conversation.updateLastActivity();

        // Emit to all participants in the conversation
        io.to(conversationId).emit('new_message', message);

        // Send acknowledgment to sender
        socket.emit('message_sent', { messageId: message._id });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      socket.to(data.conversationId).emit('user_typing', {
        userId: socket.user._id,
        username: socket.user.username,
        conversationId: data.conversationId
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(data.conversationId).emit('user_stop_typing', {
        userId: socket.user._id,
        conversationId: data.conversationId
      });
    });

    // Handle message reactions
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('reaction_error', { error: 'Message not found' });
          return;
        }

        // Check if user has access to this conversation
        const conversation = await Conversation.findById(message.conversation);
        const isParticipant = conversation.participants.includes(socket.user._id);
        if (!isParticipant) {
          socket.emit('reaction_error', { error: 'Not authorized' });
          return;
        }

        await message.addReaction(socket.user._id, emoji);
        await message.populate('reactions.user', 'username');

        // Emit to all participants in the conversation
        io.to(message.conversation.toString()).emit('message_reaction', {
          messageId,
          reactions: message.reactions
        });

      } catch (error) {
        console.error('Error adding reaction:', error);
        socket.emit('reaction_error', { error: 'Failed to add reaction' });
      }
    });

    // Handle message editing
    socket.on('edit_message', async (data) => {
      try {
        const { messageId, content } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('edit_error', { error: 'Message not found' });
          return;
        }

        // Check if user is the sender
        if (message.sender.toString() !== socket.user._id.toString()) {
          socket.emit('edit_error', { error: 'Not authorized to edit this message' });
          return;
        }

        // Check if message is not too old (15 minutes)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (message.createdAt < fifteenMinutesAgo) {
          socket.emit('edit_error', { error: 'Message is too old to edit' });
          return;
        }

        await message.editContent(content.trim());
        await message.populate('sender', 'username avatar');

        // Emit to all participants in the conversation
        io.to(message.conversation.toString()).emit('message_edited', message);

      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('edit_error', { error: 'Failed to edit message' });
      }
    });

    // Handle message deletion
    socket.on('delete_message', async (data) => {
      try {
        const { messageId } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('delete_error', { error: 'Message not found' });
          return;
        }

        // Check if user is the sender
        if (message.sender.toString() !== socket.user._id.toString()) {
          socket.emit('delete_error', { error: 'Not authorized to delete this message' });
          return;
        }

        await message.softDelete(socket.user._id);

        // Emit to all participants in the conversation
        io.to(message.conversation.toString()).emit('message_deleted', { messageId });

      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('delete_error', { error: 'Failed to delete message' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user.username} disconnected`);
      
      try {
        // Update user offline status
        await socket.user.setOnlineStatus(false);
        
        // Broadcast user offline status
        socket.broadcast.emit('user_offline', {
          userId: socket.user._id,
          username: socket.user.username,
          isOnline: false,
          lastSeen: new Date()
        });
      } catch (error) {
        console.error('Error updating user offline status:', error);
      }
    });

  } catch (error) {
    console.error('Socket connection error:', error);
    socket.disconnect();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});
