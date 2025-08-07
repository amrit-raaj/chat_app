# System Patterns

## Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │   MongoDB       │
│                 │    │                 │    │                 │
│ - Components    │◄──►│ - REST APIs     │◄──►│ - Users         │
│ - Socket Client │    │ - Socket.io     │    │ - Messages      │
│ - State Mgmt    │    │ - Auth Middleware│    │ - Conversations │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Design Patterns

### Authentication Flow
1. **Registration**: Email/Password → Hash Password → Store User → Generate JWT
2. **Login**: Validate Credentials → Generate JWT → Set HTTP-only Cookie
3. **Protected Routes**: Verify JWT → Extract User → Allow Access
4. **Logout**: Clear JWT Cookie → Invalidate Session

### Real-time Communication Pattern
```
Client A                    Server                     Client B
   │                          │                          │
   │──── Send Message ────────►│                          │
   │                          │──── Broadcast ──────────►│
   │                          │                          │
   │◄─── Acknowledgment ──────│                          │
   │                          │                          │
```

### Message Storage Pattern
- **Immediate Storage**: Messages saved to DB before broadcasting
- **Optimistic Updates**: UI updates immediately, rollback on failure
- **Message States**: Sent → Delivered → Read (future enhancement)

### File Upload Pattern
1. **Client**: Select File → Validate Type/Size → Upload to Server
2. **Server**: Receive File → Validate → Store → Generate URL → Save Reference
3. **Database**: Store file metadata with message reference
4. **Delivery**: Send file URL with message to recipients

## Component Architecture

### Frontend Components
```
App
├── AuthProvider (Context)
├── SocketProvider (Context)
├── Router
    ├── LoginPage
    ├── RegisterPage
    ├── ChatDashboard
        ├── UserList
        ├── ChatWindow
        │   ├── MessageList
        │   ├── MessageInput
        │   └── FileUpload
        └── UserProfile
```

### Backend Structure
```
server/
├── models/
│   ├── User.js
│   ├── Message.js
│   └── Conversation.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── messages.js
│   └── upload.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── socket/
│   └── socketHandlers.js
└── server.js
```

## Data Flow Patterns

### Message Flow
1. User types message in MessageInput
2. Socket emits 'send_message' event
3. Server validates and saves to database
4. Server broadcasts to conversation participants
5. Clients receive and update UI

### User State Management
- **Authentication State**: JWT token, user info
- **Socket State**: Connection status, online users
- **Chat State**: Active conversations, message history
- **UI State**: Selected conversation, typing indicators

## Error Handling Patterns
- **Network Errors**: Retry mechanism with exponential backoff
- **Authentication Errors**: Redirect to login, clear invalid tokens
- **File Upload Errors**: Progress indication, error messages
- **Socket Disconnection**: Auto-reconnect with state restoration

## Security Patterns
- **Input Sanitization**: All user inputs validated and sanitized
- **File Validation**: Type, size, and content validation
- **Rate Limiting**: API and socket event rate limiting
- **CORS**: Strict origin validation
- **JWT Security**: Short expiration, secure storage
