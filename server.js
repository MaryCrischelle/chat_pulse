// server.js
// ChatPulse - Discord OAuth2 + Bot Dashboard Backend
//
// AUTHENTICATION EXPLANATION:
// This application uses TWO different authentication methods:
//
// 1. OAuth2 User Login (for frontend):
//    - Users log in with their Discord account via OAuth2
//    - We get an access token that represents the USER
//    - This token lets us see which servers the user is in and their permissions
//    - Scopes used: "identify" (user info) and "guilds" (server list)
//
// 2. Bot Token Authentication (for backend actions):
//    - The bot token is stored ONLY on the backend (never exposed to frontend)
//    - This token represents the BOT application itself
//    - Used to check which servers the bot is installed in
//    - Used to send messages, fetch channels, and read messages
//    - The bot must be in a server AND the user must have MANAGE_GUILD permission
//
// SECURITY: The frontend never sees the bot token. All bot actions happen server-side.

import "dotenv/config";
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { handleLogin, handleCallback, handleLogout } from "./auth.js";
import {
  getUserInfo,
  getUserGuilds,
  getBotGuilds,
  getChannels,
  getMessages,
  sendMessage,
} from "./discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Express server port (fixed to 3000)
const PORT = 3000;

// Environment variables (must be defined in .env)
// DISCORD_CLIENT_ID:     Your Discord application client ID
// DISCORD_CLIENT_SECRET: Your Discord application client secret
// DISCORD_BOT_TOKEN:     Your bot token (never expose to frontend)
// SESSION_SECRET:        Express session secret
// REDIRECT_URI:          OAuth2 redirect URL, "http://localhost:3000/callback"
const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_BOT_TOKEN,
  SESSION_SECRET,
  REDIRECT_URI,
} = process.env;

if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_BOT_TOKEN) {
  console.error(
    "[Config] Missing one or more required Discord env vars: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_BOT_TOKEN"
  );
  process.exit(1);
}

const DISCORD_REDIRECT_URI = REDIRECT_URI || "http://localhost:3000/callback";
const BOT_TOKEN = DISCORD_BOT_TOKEN;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: SESSION_SECRET || "chatpulse-secret-change-in-production",
    resave: true, // Changed to true to ensure session is saved
    saveUninitialized: true, // Changed to true to save session even if not modified
    cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true, // Prevent client-side JavaScript access
      sameSite: "lax", // CSRF protection
    },
  })
);

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  if (!req.session.accessToken) {
    return res.redirect("/");
  }
  next();
}

// OAuth2 Routes (must be before static middleware)
app.get("/login", (req, res) => {
  handleLogin(req, res, DISCORD_CLIENT_ID, DISCORD_REDIRECT_URI);
});

app.get("/callback", async (req, res) => {
  await handleCallback(
    req,
    res,
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI
  );
});

app.get("/logout", (req, res) => {
  handleLogout(req, res);
});

// Protected API Routes
app.get("/me", requireAuth, async (req, res) => {
  try {
    const userInfo = await getUserInfo(req.session.accessToken);
    res.json({ success: true, user: userInfo });
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ success: false, error: "Failed to fetch user info" });
  }
});

app.get("/guilds", requireAuth, async (req, res) => {
  try {
    // Step 1: Fetch user's guilds using OAuth access token (not bot token)
     const userGuilds = await getUserGuilds(req.session.accessToken);
     console.log(`[Guilds] User is in ${userGuilds.length} guilds`);

    if (userGuilds.length === 0) {
      console.log("[Guilds] User is not in any guilds");
      return res.json({
        success: true,
        guilds: [],
        debug: "User is not a member of any Discord servers",
      });
    }

    // Step 2: Filter by Manage Server permission (0x20)
    const MANAGE_GUILD_PERMISSION = 0x20;
    const guildsWithPermission = userGuilds.filter((guild) => {
      const permissions = BigInt(guild.permissions || "0");
      const hasPermission =
        (permissions & BigInt(MANAGE_GUILD_PERMISSION)) !== 0n;
      if (hasPermission) {
        console.log(
          `[Guilds] User has Manage Server in: ${guild.name} (${guild.id})`
        );
      } else {
        console.log(
          `[Guilds] User lacks Manage Server in: ${guild.name} (${guild.id})`
        );
      }
      return hasPermission;
    });
    console.log(
      `[Guilds] ${guildsWithPermission.length} guilds with Manage Server permission`
    );

    if (guildsWithPermission.length === 0) {
      console.log(
        "[Guilds] User has no guilds with Manage Server permission"
      );
      return res.json({
        success: true,
        guilds: [],
        debug:
          "You don't have 'Manage Server' permission in any of your servers",
      });
    }

    // Step 3: Verify bot is actually installed by attempting to fetch channels
    // This is more reliable than checking bot guild list
    const validGuilds = [];
    for (const guild of guildsWithPermission) {
      try {
        // Try to fetch channels - if bot is not in guild, this will fail with 403/404
        const channels = await getChannels(BOT_TOKEN, guild.id);
        // If we got channels (even empty array), bot is in the guild
        validGuilds.push({
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          owner: guild.owner,
        });
        console.log(
          `[Guilds] Bot verified in: ${guild.name} (${guild.id}) - ${channels.length} text channels`
        );
      } catch (error) {
        // Bot is not in this guild or lacks permissions
        console.log(
          `[Guilds] Bot NOT in: ${guild.name} (${guild.id}) - ${error.message}`
        );
      }
    }

    console.log(`[Guilds] Returning ${validGuilds.length} valid guilds`);
    
    if (validGuilds.length === 0) {
      return res.json({
        success: true,
        guilds: [],
        debug:
          "The bot is not installed in any of your servers. Please invite the bot to your server first.",
      });
    }

    res.json({ success: true, guilds: validGuilds });
  } catch (error) {
    console.error("Error fetching guilds:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch guilds",
      details: error.message,
    });
  }
});

app.get("/channels/:guildId", requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const channels = await getChannels(BOT_TOKEN, guildId);
    res.json({ success: true, channels });
  } catch (error) {
    console.error("Error fetching channels:", error);
    res.status(500).json({ success: false, error: "Failed to fetch channels" });
  }
});

app.get("/messages/:channelId", requireAuth, async (req, res) => {
  try {
    const { channelId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const messages = await getMessages(BOT_TOKEN, channelId, limit);
    res.json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, error: "Failed to fetch messages" });
  }
});

app.post("/send-message", requireAuth, async (req, res) => {
  try {
    const { channelId, message } = req.body;

    if (!channelId || !message) {
      return res.status(400).json({
        success: false,
        error: "channelId and message are required",
      });
    }

    const result = await sendMessage(BOT_TOKEN, channelId, message);
    res.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
});

// Redirect root to dashboard if authenticated, otherwise show landing page
app.get("/", (req, res) => {
  if (req.session.accessToken) {
    return res.redirect("/dashboard.html");
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve static files (must be last, after all routes)
app.use(express.static(path.join(__dirname, "public")));

// Start server
app.listen(PORT, () => {
  console.log(`ChatPulse server is running at http://localhost:${PORT}`);
  console.log(`Discord redirect URI is: ${DISCORD_REDIRECT_URI}`);
});
