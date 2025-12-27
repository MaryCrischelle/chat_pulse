// discord.js
// Discord REST API v10 wrapper functions
// All functions use the Discord REST API directly (no discord.js library)

import fetch from "node-fetch";

const DISCORD_API_BASE = "https://discord.com/api/v10";

/**
 * Fetch current user info using OAuth2 access token
 */
export async function getUserInfo(accessToken) {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetch user's guilds (servers) using OAuth2 access token
 */
export async function getUserGuilds(accessToken) {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`,{
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user guilds: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetch guilds where the bot is present using bot token
 */
export async function getBotGuilds(botToken) {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bot guilds: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetch text channels from a guild using bot token
 */
export async function getChannels(botToken, guildId) {
  const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/channels`, {
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch channels: ${response.statusText}`);
  }

  const allChannels = await response.json();
  // Filter to only text channels (type 0)
  return allChannels.filter((channel) => channel.type === 0);
}

/**
 * Fetch messages from a channel using bot token
 */
export async function getMessages(botToken, channelId, limit = 10) {
  const response = await fetch(
    `${DISCORD_API_BASE}/channels/${channelId}/messages?limit=${limit}`,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Send a message to a channel using bot token
 */
export async function sendMessage(botToken, channelId, content) {
  const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${botToken}`,
    },
    body: JSON.stringify({
      content: content,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send message: ${response.status} ${errorText}`);
  }

  return await response.json();
}

