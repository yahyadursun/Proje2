# Chat Application

A real-time chat application built with React and Node.js, featuring direct messaging and channel-based communication.

## Project Structure

- **client/** - Frontend React application
- **server/** - Backend Node.js application

## Technologies Used

### Frontend
- React 19
- React Router
- Socket.io Client
- Tailwind CSS
- Radix UI Components
- Vite

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- Socket.io
- JWT Authentication
- Multer (file uploads)

## Features

- User authentication (login/register)
- Real-time messaging
- Direct messaging between users
- Channel-based group messaging
- File sharing
- Profile management
- Voice messages

## Getting Started

### Prerequisites
- Node.js
- MongoDB

### Installation

1. Clone the repository
```
git clone <repository-url>
```

2. Install dependencies for the root project, client, and server
```
npm install
cd client && npm install
cd ../server && npm install
```

3. Configure environment variables
   - Create a `.env` file in the server directory with the following variables:
     ```
     PORT=3001
     DATABASE_URL=<your-mongodb-connection-string>
     JWT_SECRET=<your-jwt-secret>
     ORIGIN=http://localhost:5173
     ```

4. Start the development servers

   For the server:
   ```
   cd server
   npm run dev
   ```

   For the client:
   ```
   cd client
   npm run dev
   ```

## API Routes

- `/api/auth` - Authentication routes
- `/api/contacts` - Contact management
- `/api/messages` - Message handling
- `/api/channel` - Channel operations

## Socket Events

- `sendMessage` - Send a direct message
- `send-channel-message` - Send a message to a channel
- `recieveMessage` - Receive a direct message
- `recieve-channel-message` - Receive a channel message 