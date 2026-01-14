// auth.js
// OAuth2 authentication handlers for Discord

import fetch from "node-fetch";

/**
 ** Redirect user to Discord OAuth2 login page
 **/
export function handleLogin(req, res, clientId, redirectUri) {
  // If the user is already logged in, skip OAuth and go straight to dashboard
  if (req.session && req.session.accessToken) {
    console.log("[OAuth] User already authenticated, skipping login");
    return res.redirect("/dashboard.html");
  }

  const state = Math.random().toString(36).substring(2);
  req.session.oauthState = state;
  
  // Save session before redirecting
  req.session.save((err) => {
    if (err) {
      console.error("[OAuth] Error saving session:", err);
      return res.status(500).send("Failed to initialize login");
    }

    console.log("[OAuth] State generated and saved:", state);
    console.log("[OAuth] Session ID:", req.sessionID);

    const scopes = "identify guilds";
    const authUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;

    console.log("[OAuth] Redirecting to Discord login");
    res.redirect(authUrl);
  });
}

/**
 * Handle OAuth2 callback from Discord
 */
export async function handleCallback(
  req,
  res,
  clientId,
  clientSecret,
  redirectUri
) {
  const { code, state } = req.query;

  console.log("[OAuth] State received from Discord:", state);
  console.log("[OAuth] State stored in session:", req.session.oauthState);
  console.log("[OAuth] Session ID:", req.sessionID);
  console.log("[OAuth] Session exists:", !!req.session);

  // Verify state to prevent CSRF
  if (!state) {
    console.error("[OAuth] No state received from Discord");
    return res
      .status(400)
      .send("Login failed. Please try again. (no state received)");
  }

  if (!req.session || !req.session.oauthState) {
    console.error("[OAuth] No state found in session");
    console.error("[OAuth] Session data:", req.session);
    return res
      .status(400)
      .send("Login failed. Please try again. (session expired - try logging in again)");
  }

  if (state !== req.session.oauthState) {
    console.error("[OAuth] State mismatch");
    console.error("[OAuth] Expected:", req.session.oauthState);
    console.error("[OAuth] Received:", state);
    return res
      .status(400)
      .send("Login failed. Please try again. (invalid state)");
  }

  if (!code) {
    console.error("[OAuth] No code received");
    return res
      .status(400)
      .send("Login failed. Please try again. (missing code)");
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[OAuth] Token exchange failed:", errorText);
      return res
        .status(400)
        .send("Login failed. Please try again. (token error)");
    }

    const tokenData = await tokenResponse.json();

    // Store access token in session for later API calls
    req.session.accessToken = tokenData.access_token;

    // Fetch user profile using the access token and store minimal info in session
    const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const userError = await userResponse.text();
      console.error("[OAuth] Failed to fetch user profile:", userError);
      return res
        .status(400)
        .send("Login failed. Please try again. (user fetch error)");
    }

    const userData = await userResponse.json();
    req.session.user = {
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar,
      discriminator: userData.discriminator,
    };

    // Clear state after successful validation & login
    req.session.oauthState = null;

    console.log("[OAuth] Authentication successful for user:", userData.username);
    res.redirect("/dashboard.html");
  } catch (error) {
    console.error("[OAuth] Error during callback:", error);
    res.status(400).send("Login failed. Please try again. (callback error)");
  }
}

/**
 * Logout user and clear session
 */
export function handleLogout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error("[OAuth] Error destroying session:", err);
    }
    console.log("[OAuth] User logged out");
    res.redirect("/");
  });
}

