// script.js
// ChatPulse Dashboard Frontend Logic

// DOM Elements
const userInfo = document.getElementById("userInfo");
const userName = document.getElementById("userName");
const userAvatar = document.getElementById("userAvatar");
const logoutBtn = document.getElementById("logoutBtn");
const serverSelect = document.getElementById("serverSelect");
const channelSelect = document.getElementById("channelSelect");
const messagesContainer = document.getElementById("messagesContainer");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const statusText = document.getElementById("statusText");
const refreshBtn = document.getElementById("refreshBtn");
const serverHelp = document.getElementById("serverHelp");

let currentChannelId = null;

// Check authentication on page load
window.addEventListener("DOMContentLoaded", async () => {
  await loadUserInfo();
  await loadGuilds();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  logoutBtn.addEventListener("click", () => {
    window.location.href = "/logout";
  });

  serverSelect.addEventListener("change", async (e) => {
    const guildId = e.target.value;
    if (guildId) {
      await loadChannels(guildId);
    } else {
      channelSelect.innerHTML = '<option value="">Select a server first...</option>';
      channelSelect.disabled = true;
      clearMessages();
    }
  });

  channelSelect.addEventListener("change", async (e) => {
    const channelId = e.target.value;
    if (channelId) {
      currentChannelId = channelId;
      messageInput.disabled = false;
      sendBtn.disabled = false;
      refreshBtn.disabled = false;
      await loadMessages(channelId);
    } else {
      currentChannelId = null;
      messageInput.disabled = true;
      sendBtn.disabled = true;
      refreshBtn.disabled = true;
      clearMessages();
    }
  });

  sendBtn.addEventListener("click", sendMessage);
  refreshBtn.addEventListener("click", () => {
    if (currentChannelId) {
      loadMessages(currentChannelId);
    }
  });

  // Ctrl+Enter to send
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// Load user info
async function loadUserInfo() {
  try {
    const response = await fetch("/me");
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/";
        return;
      }
      throw new Error("Failed to fetch user info");
    }

    const data = await response.json();
    if (data.success && data.user) {
      userName.textContent = data.user.username || "User";
      const avatarUrl = data.user.avatar
        ? `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png?size=40`
        : `https://cdn.discordapp.com/embed/avatars/${(data.user.discriminator || "0") % 5}.png`;
      userAvatar.src = avatarUrl;
    }
  } catch (error) {
    console.error("Error loading user info:", error);
    setStatus("error", "Failed to load user info");
  }
}

// Load guilds (servers)
async function loadGuilds() {
  try {
    setStatus("sending", "Loading servers...");
    const response = await fetch("/guilds");
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/";
        return;
      }
      throw new Error("Failed to fetch guilds");
    }

    const data = await response.json();
    if (data.success && data.guilds) {
      serverSelect.innerHTML = '<option value="">Choose a server...</option>';
      data.guilds.forEach((guild) => {
        const option = document.createElement("option");
        option.value = guild.id;
        option.textContent = guild.name;
        serverSelect.appendChild(option);
      });

      if (data.guilds && data.guilds.length === 0) {
        // Show debug message if available
        if (data.debug) {
          serverHelp.textContent = data.debug;
        } else {
          serverHelp.textContent =
            "No servers found. Make sure you have Manage Server permission and the bot is installed.";
        }
        serverHelp.style.color = "#f97373";
      } else {
        serverHelp.textContent =
          "Only servers where you have Manage Server permission and the bot is installed are shown.";
        serverHelp.style.color = "#6b7280";
      }
    }
    setStatus("idle", "");
  } catch (error) {
    console.error("Error loading guilds:", error);
    setStatus("error", "Failed to load servers");
  }
}

// Load channels for a guild
async function loadChannels(guildId) {
  try {
    channelSelect.disabled = true;
    channelSelect.innerHTML = '<option value="">Loading channels...</option>';
    setStatus("sending", "Loading channels...");

    const response = await fetch(`/channels/${guildId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch channels");
    }

    const data = await response.json();
    if (data.success && data.channels) {
      channelSelect.innerHTML = '<option value="">Choose a channel...</option>';
      data.channels.forEach((channel) => {
        const option = document.createElement("option");
        option.value = channel.id;
        option.textContent = `# ${channel.name}`;
        channelSelect.appendChild(option);
      });

      if (data.channels.length === 0) {
        channelSelect.innerHTML = '<option value="">No text channels found</option>';
      } else {
        channelSelect.disabled = false;
      }
    }
    setStatus("idle", "");
  } catch (error) {
    console.error("Error loading channels:", error);
    channelSelect.innerHTML = '<option value="">Error loading channels</option>';
    setStatus("error", "Failed to load channels");
  }
}

// Load messages from a channel
async function loadMessages(channelId) {
  try {
    messagesContainer.innerHTML = '<p class="empty-state">Loading messages...</p>';
    setStatus("sending", "Loading messages...");

    const response = await fetch(`/messages/${channelId}?limit=10`);
    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    const data = await response.json();
    if (data.success && data.messages) {
      if (data.messages.length === 0) {
        messagesContainer.innerHTML =
          '<p class="empty-state">No messages found in this channel</p>';
      } else {
        messagesContainer.innerHTML = "";
        data.messages.forEach((msg) => {
          const messageEl = createMessageElement(msg);
          messagesContainer.appendChild(messageEl);
        });
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
    setStatus("idle", "");
  } catch (error) {
    console.error("Error loading messages:", error);
    messagesContainer.innerHTML =
      '<p class="empty-state" style="color: #f97373;">Failed to load messages</p>';
    setStatus("error", "Failed to load messages");
  }
}

// Create message element
function createMessageElement(msg) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message-item";

  const header = document.createElement("div");
  header.className = "message-header";

  const author = document.createElement("span");
  author.className = "message-author";
  author.textContent = msg.author?.username || "Unknown User";

  const timestamp = document.createElement("span");
  timestamp.className = "message-timestamp";
  const date = new Date(msg.timestamp);
  timestamp.textContent = date.toLocaleString();

  header.appendChild(author);
  header.appendChild(timestamp);

  const content = document.createElement("div");
  content.className = "message-content";
  content.textContent = msg.content || "(No content)";

  messageDiv.appendChild(header);
  messageDiv.appendChild(content);

  return messageDiv;
}

// Clear messages
function clearMessages() {
  messagesContainer.innerHTML =
    '<p class="empty-state">Select a channel to view messages</p>';
}

// Send message
async function sendMessage() {
  if (!currentChannelId) {
    setStatus("error", "Please select a channel first");
    return;
  }

  const message = messageInput.value.trim();
  if (!message) {
    setStatus("error", "Please enter a message");
    return;
  }

  setStatus("sending", "Sending message...");
  sendBtn.disabled = true;

  try {
    const response = await fetch("/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelId: currentChannelId,
        message: message,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to send message");
    }

    setStatus("success", "Message sent successfully!");
    messageInput.value = "";
    
    // Reload messages after a short delay
    setTimeout(() => {
      loadMessages(currentChannelId);
    }, 500);
  } catch (error) {
    console.error("Error sending message:", error);
    setStatus("error", error.message || "Failed to send message");
  } finally {
    sendBtn.disabled = false;
  }
}

// Set status text
function setStatus(state, text) {
  statusText.textContent = text;
  statusText.classList.remove("status-sending", "status-success", "status-error");

  if (state === "sending") statusText.classList.add("status-sending");
  if (state === "success") statusText.classList.add("status-success");
  if (state === "error") statusText.classList.add("status-error");
  if (state === "idle") {
    // Keep current classes but clear text
  }
}
