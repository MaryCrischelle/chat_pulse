# ChatPulse Discord

A simple, secure Discord OAuth2 + Bot Dashboard web application that allows users to manage Discord servers and send messages through a bot.

## 🎯 Features

- **Discord OAuth2 Authentication** - Secure user login via Discord
- **Server Management** - View and manage Discord servers where you have "Manage Server" permission
- **Channel Selection** - Browse text channels in selected servers
- **Message Viewing** - View the last 10 messages in any channel
- **Message Sending** - Send messages to Discord channels via the bot
- **Multi-User Support** - Switch between different Discord accounts seamlessly
- **Dark Theme UI** - Modern, clean interface inspired by Discord

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Authentication**: Discord OAuth2 (identify, guilds scopes)
- **Session Management**: express-session
- **API**: Discord REST API v10

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- A Discord Application with Bot
- A Discord account with "Manage Server" permission in at least one server

## 🚀 Setup Instructions

### 1. Clone or Download the Project

```bash
cd "ChatPulse Discord"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root with the following content:

```env
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_BOT_TOKEN=your_bot_token

SESSION_SECRET=your_random_session_secret

REDIRECT_URI=http://localhost:3000/callback
```

**Where to find these values:**
- **DISCORD_CLIENT_ID**: Discord Developer Portal → Your Application → OAuth2 → Client ID
- **DISCORD_CLIENT_SECRET**: Discord Developer Portal → Your Application → OAuth2 → Client Secret
- **DISCORD_BOT_TOKEN**: Discord Developer Portal → Your Application → Bot → Token
- **SESSION_SECRET**: Any long random string (for session encryption)
- **REDIRECT_URI**: Must match exactly what you set in Discord Developer Portal

### 4. Configure Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to **OAuth2** → **Redirects**
4. Add redirect URI: `http://localhost:3000/callback`
5. Go to **Bot** section
6. Copy your bot token
7. Enable **Message Content Intent** if you want to read message content

### 5. Invite Bot to Your Server

1. Go to **OAuth2** → **URL Generator**
2. Select scopes: `bot`
3. Select bot permissions: `Send Messages`, `Read Message History`, `View Channels`
4. Copy the generated URL
5. Open the URL in your browser and invite the bot to your server

### 6. Start the Server

```bash
node server.js
```

The server will start on `http://localhost:3000`

### 7. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 📁 Project Structure

```
ChatPulse Discord/
├── .env                 # Environment variables (create this)
├── package.json         # Node.js dependencies
├── server.js            # Express server and API routes
├── auth.js              # OAuth2 authentication handlers
├── discord.js           # Discord REST API wrapper functions
└── public/
    ├── index.html       # Landing/login page
    ├── dashboard.html   # Main dashboard
    ├── script.js        # Frontend JavaScript
    └── style.css        # Styling
```

## 🔐 Security Features

- **Server-Side Token Storage** - Bot token never exposed to frontend
- **OAuth2 State Validation** - CSRF protection via state parameter
- **Session-Based Authentication** - Secure session management
- **Permission Checks** - Only shows servers where user has "Manage Server" permission
- **Bot Verification** - Only displays servers where bot is actually installed

## 📖 Usage Guide

### Logging In

1. Click **"Login with Discord"** on the landing page
2. Authorize the application in Discord
3. You'll be redirected to the dashboard

### Using the Dashboard

1. **Select a Server** - Choose from servers where you have "Manage Server" permission and the bot is installed
2. **Select a Channel** - Choose a text channel from the selected server
3. **View Messages** - The last 10 messages will appear automatically
4. **Send Messages** - Type your message and click "Send Message" or press `Ctrl+Enter`
5. **Refresh Messages** - Click the "Refresh" button to reload messages

### Switching Accounts

1. Click **"Logout"** in the dashboard header
2. Click **"Login with Discord"** again
3. Log in with a different Discord account

## 🔧 API Endpoints

### Public Endpoints

- `GET /` - Landing page (redirects to dashboard if logged in)
- `GET /login` - Initiates Discord OAuth2 login
- `GET /callback` - OAuth2 callback handler
- `GET /logout` - Logs out the current user

### Protected Endpoints (Require Authentication)

- `GET /me` - Get current user info
- `GET /guilds` - Get list of accessible servers
- `GET /channels/:guildId` - Get channels for a server
- `GET /messages/:channelId?limit=10` - Get messages from a channel
- `POST /send-message` - Send a message to a channel

## ⚠️ Troubleshooting

### "No servers found"

**Possible causes:**
1. Bot is not installed in your server
   - **Solution**: Invite the bot to your server using the OAuth2 URL Generator
2. You don't have "Manage Server" permission
   - **Solution**: Ask a server admin to grant you "Manage Server" permission
3. Bot token is invalid
   - **Solution**: Regenerate the bot token in Discord Developer Portal

### "Invalid state" error

- Clear your browser cookies and try again
- Make sure you're not opening multiple login tabs simultaneously

### "Cannot GET /login"

- Make sure the server is running: `node server.js`
- Check that you're accessing `http://localhost:3000` (not port 300)

### Environment variables not loading

- Ensure `.env` file exists in the project root
- Check that variable names match exactly (case-sensitive)
- Restart the server after changing `.env`

### Bot can't send messages

- Verify bot has "Send Messages" permission in the channel
- Check that the bot is not muted or restricted
- Ensure the channel is a text channel (not voice/category)

## 🎓 Educational Notes

This project demonstrates:
- OAuth2 authentication flow
- Express.js server setup
- Session management
- REST API integration
- Frontend-backend separation
- Security best practices

## 📝 Important Notes

- **No Private Messages**: ChatPulse only accesses server channels, not DMs or group chats
- **Bot Actions Only**: All messages are sent by the bot, not as the user
- **Permission Required**: Users must have "Manage Server" permission to see servers
- **Bot Must Be Installed**: The bot must be invited to servers before they appear

## 🔒 Compliance

This application:
- ✅ Uses official Discord OAuth2
- ✅ Uses bot token server-side only
- ✅ Respects Discord Terms of Service
- ✅ Only accesses server channels (no DMs)
- ✅ Requires proper permissions

## 📄 License

MIT License

## 🤝 Contributing

This is a school project, but suggestions and improvements are welcome!

## 📧 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review server console logs for error messages
3. Verify all environment variables are set correctly

---

**ChatPulse** - Simple Discord Bot Dashboard | Built with Node.js + Express

