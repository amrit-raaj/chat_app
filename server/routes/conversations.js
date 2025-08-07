const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all conversations for the logged-in user
// @route   GET /api/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.findByUser(req.user.id);
    
    // Add unread count for each conversation and ensure participants are populated
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.getUnreadCount(conversation._id, req.user.id);
        
        // Ensure participants are populated if not already
        if (!conversation.participants[0]?.username) {
          await conversation.populate('participants', 'username email avatar isOnline lastSeen');
        }
        
        return {
          ...conversation.toObject(),
          unreadCount
        };
      })
    );

    res.status(200).json({
      success: true,
      conversations: conversationsWithUnread
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversations'
    });
  }
};

// @desc    Create or get direct conversation with another user
// @route   POST /api/conversations/direct
// @access  Private
const createDirectConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself'
      });
    }

    // Check if the other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create or get existing conversation
    const conversation = await Conversation.createOrGetDirectConversation(req.user.id, userId);

    // Ensure participants are populated
    await conversation.populate('participants', 'username email avatar isOnline lastSeen');

    res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Create direct conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating conversation'
    });
  }
};

// @desc    Get conversation by ID
// @route   GET /api/conversations/:id
// @access  Private
const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'username email avatar isOnline lastSeen')
      .populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      participant => participant._id.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this conversation'
      });
    }

    res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversation'
    });
  }
};

// @desc    Search users to start conversations
// @route   GET /api/conversations/search-users
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const users = await User.find({
      _id: { $ne: req.user.id }, // Exclude current user
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username email avatar isOnline lastSeen')
    .limit(10);

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
};

// Routes
router.get('/', protect, getConversations);
router.post('/direct', protect, createDirectConversation);
router.get('/search-users', protect, searchUsers);
router.get('/:id', protect, getConversationById);

module.exports = router;
