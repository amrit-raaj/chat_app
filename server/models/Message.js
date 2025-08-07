const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video'],
    default: 'text'
  },
  file: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    url: String
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  edited: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    originalContent: String
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ type: 1 });
messageSchema.index({ isDeleted: 1 });

// Virtual for file URL
messageSchema.virtual('fileUrl').get(function() {
  if (this.file && this.file.path) {
    return `/uploads/${this.file.filename}`;
  }
  return null;
});

// Method to mark as read by user
messageSchema.methods.markAsRead = function(userId) {
  // Check if user already read this message
  const existingRead = this.readBy.find(read => read.user.equals(userId));
  
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(reaction => !reaction.user.equals(userId));
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji: emoji
  });
  
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(reaction => !reaction.user.equals(userId));
  return this.save();
};

// Method to edit message
messageSchema.methods.editContent = function(newContent) {
  if (!this.edited.isEdited) {
    this.edited.originalContent = this.content;
  }
  
  this.content = newContent;
  this.edited.isEdited = true;
  this.edited.editedAt = new Date();
  
  return this.save();
};

// Method to soft delete message
messageSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Static method to find messages by conversation with pagination
messageSchema.statics.findByConversation = function(conversationId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({
    conversation: conversationId,
    isDeleted: false
  })
  .populate('sender', 'username avatar')
  .populate('replyTo', 'content sender type')
  .populate('reactions.user', 'username')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to get unread count for user in conversation
messageSchema.statics.getUnreadCount = function(conversationId, userId) {
  return this.countDocuments({
    conversation: conversationId,
    isDeleted: false,
    sender: { $ne: userId },
    'readBy.user': { $ne: userId }
  });
};

// Pre-save middleware to validate content based on type
messageSchema.pre('save', function(next) {
  if (this.type === 'text' && (!this.content || this.content.trim() === '')) {
    return next(new Error('Text messages must have content'));
  }
  
  if (['image', 'file', 'voice'].includes(this.type) && !this.file) {
    return next(new Error(`${this.type} messages must have file data`));
  }
  
  next();
});

module.exports = mongoose.model('Message', messageSchema);
