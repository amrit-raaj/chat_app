# 💬 Real-Time Chat Application

A full-stack, real-time chat application built with React, Node.js, Socket.io, and MongoDB. Features include user authentication, image sharing, emoji support, and a modern Material-UI interface.

![Chat Application](https://img.shields.io/badge/Status-Complete-brightgreen)
![React](https://img.shields.io/badge/React-18.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black)

## ✨ Features

### 🔐 Authentication & Security
- **Email Verification**: Secure user registration with email confirmation
- **JWT Authentication**: Token-based authentication system
- **Password Security**: Bcrypt password hashing
- **Session Management**: Persistent login sessions

### 💬 Real-Time Messaging
- **Instant Messaging**: Real-time message delivery with Socket.io
- **Typing Indicators**: See when others are typing
- **Online Status**: Live user presence indicators
- **Message History**: Persistent chat history

### 🖼️ Rich Media Support
- **Image Sharing**: Upload and share photos (up to 5MB)
- **Emoji Picker**: Full emoji support with picker interface
- **File Validation**: Client and server-side file validation
- **Progress Tracking**: Real-time upload progress

### 🎨 Modern UI/UX
- **Material-UI Design**: Professional, responsive interface
- **Dark/Light Theme**: Toggle between themes
- **Mobile Responsive**: Works on all device sizes
- **Smooth Animations**: Polished user experience

### 👥 User Management
- **Contact Search**: Find users by username or email
- **Direct Messaging**: One-on-one conversations
- **User Profiles**: Avatar and profile management
- **Participant Lists**: See conversation members

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Material-UI** - Component library and theming
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client with interceptors
- **React Router** - Navigation and routing

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.io** - Real-time bidirectional communication
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Multer** - File upload handling
- **Nodemailer** - Email service integration

### Security & Validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Joi** - Data validation
- **Rate Limiting** - API protection

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chat-application.git
   cd chat-application
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   ```

3. **Environment Setup**
   
   Create `server/.env` file:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chatapp
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   CLIENT_URL=http://localhost:3000
   
   # Email Configuration (for verification)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   EMAIL_FROM=your_email@gmail.com
   ```

4. **Start the application**
   ```bash
   # From root directory - starts both client and server
   npm run dev
   
   # Or start individually:
   # Server (from server directory)
   npm run dev
   
   # Client (from client directory)
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
chat-application/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── ...
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # Database configuration
│   ├── middleware/        # Custom middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── uploads/          # File uploads
│   └── package.json
├── memory-bank/          # Project documentation
├── .gitignore
├── package.json          # Root package.json
└── README.md
```

## 🔧 Configuration

### Database Setup
1. Install MongoDB locally or use MongoDB Atlas
2. Update `MONGODB_URI` in server/.env
3. Database will be created automatically on first run

### Email Service Setup
1. Use Gmail with App Password or other SMTP service
2. Update email configuration in server/.env
3. Required for user registration verification

### File Upload Configuration
- Images are stored in `server/uploads/images/`
- Maximum file size: 5MB
- Supported formats: All image types
- Files are served statically at `/uploads/`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify-email/:token` - Email verification

### Conversation Endpoints
- `GET /api/conversations` - Get user conversations
- `POST /api/conversations/direct` - Create direct conversation
- `GET /api/conversations/search-users` - Search users
- `GET /api/conversations/:id` - Get conversation details

### Message Endpoints
- `GET /api/messages/:conversationId` - Get messages
- `POST /api/messages` - Send message
- `POST /api/messages/upload-image` - Upload image
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

### Socket Events
- `join_conversation` - Join conversation room
- `leave_conversation` - Leave conversation room
- `send_message` - Send real-time message
- `typing_start` / `typing_stop` - Typing indicators
- `user_online` / `user_offline` - Presence updates

## 🧪 Development

### Available Scripts

**Root Directory:**
- `npm run dev` - Start both client and server
- `npm run server` - Start server only
- `npm run client` - Start client only

**Server Directory:**
- `npm run dev` - Start with nodemon (auto-restart)
- `npm start` - Start production server

**Client Directory:**
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Development Tips
1. Use `npm run dev` from root for full-stack development
2. Server runs on port 5000, client on port 3000
3. Hot reloading enabled for both frontend and backend
4. Check browser console for debugging information

## 🚀 Deployment

### Environment Variables
Ensure all production environment variables are set:
- `NODE_ENV=production`
- `MONGODB_URI` (production database)
- `JWT_SECRET` (strong secret key)
- Email service credentials

### Build Process
```bash
# Build client for production
cd client && npm run build

# Start production server
cd server && npm start
```

### Deployment Platforms
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Backend**: Heroku, Railway, DigitalOcean
- **Database**: MongoDB Atlas, AWS DocumentDB

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Socket.io](https://socket.io/) for real-time communication
- [Material-UI](https://mui.com/) for the component library
- [MongoDB](https://www.mongodb.com/) for the database
- [React](https://reactjs.org/) for the frontend framework
- [Express.js](https://expressjs.com/) for the backend framework

## 📞 Support

If you have any questions or need help with setup, please open an issue or contact [your-email@example.com](mailto:your-email@example.com).

---

**Made with ❤️ by [Your Name]**
