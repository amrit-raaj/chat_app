const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Conversation name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  avatar: {
    type: String,
    default: ''
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ type: 1 });

// Virtual for participant count
conversationSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Method to add participant
conversationSchema.methods.addParticipant = function(userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove participant
conversationSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(
    participant => !participant.equals(userId)
  );
  return this.save();
};

// Method to update last activity
conversationSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Static method to find conversations by user
conversationSchema.statics.findByUser = function(userId) {
  return this.find({
    participants: userId,
    isActive: true
  })
  .populate('participants', 'username email avatar isOnline lastSeen')
  .populate('lastMessage')
  .sort({ lastActivity: -1 });
};

// Static method to find direct conversation between two users
conversationSchema.statics.findDirectConversation = function(user1Id, user2Id) {
  return this.findOne({
    type: 'direct',
    participants: { $all: [user1Id, user2Id], $size: 2 },
    isActive: true
  })
  .populate('participants', 'username email avatar isOnline lastSeen');
};

// Static method to create or get direct conversation
conversationSchema.statics.createOrGetDirectConversation = async function(user1Id, user2Id) {
  // Try to find existing conversation
  let conversation = await this.findDirectConversation(user1Id, user2Id);
  
  if (!conversation) {
    // Create new conversation
    conversation = new this({
      participants: [user1Id, user2Id],
      type: 'direct',
      createdBy: user1Id
    });
    await conversation.save();
    await conversation.populate('participants', 'username email avatar isOnline lastSeen');
  }
  
  return conversation;
};

module.exports = mongoose.model('Conversation', conversationSchema);
