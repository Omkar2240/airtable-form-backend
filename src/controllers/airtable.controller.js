import axios from "axios";
import User from "../models/User.js";
import {
  listBases,
  listTables,
  listFields,
} from "../services/airtableService.js";

import sha256 from "crypto-js/sha256.js";
import Base64 from "crypto-js/enc-base64.js";


// URL-safe Base64
function base64url(base64) {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Generate PKCE code_verifier (high entropy string)
function generateCodeVerifier(length = 64) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let verifier = "";
  for (let i = 0; i < length; i++) {
    verifier += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return verifier;
}

// Generate cryptographically secure state string
function generateState(length = 16) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let state = "";
  for (let i = 0; i < length; i++) {
    state += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return state;
}

// Generate PKCE challenge (SHA-256 → base64url)
function generateCodeChallenge(verifier) {
  const hash = sha256(verifier);
  const base64 = Base64.stringify(hash);
  return base64url(base64);
}

// Fetch user from DB using x-user-id header
async function getUser(req) {
  const userId = req.headers["x-user-id"];
  if (!userId) throw new Error("User not authenticated");

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  return user;
}

export async function login(req, res) {
  try {
    const scopes =
      "data.records:read data.records:write schema.bases:read schema.bases:write webhook:manage";

    const clientId = process.env.AIRTABLE_CLIENT_ID;
    const redirectUri = process.env.AIRTABLE_REDIRECT_URI;

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const state = generateState(16);

    // save session for callback verification
    req.session.oauthState = state;
    req.session.codeVerifier = codeVerifier;
    await req.session.save();

    const url =
      `https://airtable.com/oauth2/v1/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${state}` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256`;

    res.redirect(url);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function callback(req, res) {
  try {
    const { code, state } = req.query;

    if (!code) return res.status(400).json({ error: "No code provided" });
    if (!state) return res.status(400).json({ error: "No state provided" });

    // validate state and codeverifier from session
    const storedState = req.session.oauthState;
    const codeVerifier = req.session.codeVerifier;

    if (!storedState || storedState !== state) {
      return res.status(400).json({ error: "Invalid state (CSRF detected)" });
    }
    if (!codeVerifier) {
      return res.status(400).json({ error: "Missing code_verifier" });
    }

    // cleanup session
    delete req.session.oauthState;
    delete req.session.codeVerifier;

    const clientId = process.env.AIRTABLE_CLIENT_ID;
    const clientSecret = process.env.AIRTABLE_CLIENT_SECRET;
    const redirectUri = process.env.AIRTABLE_REDIRECT_URI;

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    const tokenRes = await axios.post(
      "https://airtable.com/oauth2/v1/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // Fetch user identity
    const meRes = await axios.get("https://api.airtable.com/v0/meta/whoami", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const airtableUserId = meRes.data.id;
    // save user in MongoDB
    let user = await User.findOne({ airtableUserId });
    if (!user) {
      user = new User({ airtableUserId });
    }
    user.accessToken = access_token;
    user.refreshToken = refresh_token;
    user.tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
    await user.save();

    // res.cookie("userId", user._id, {
    //   httpOnly: false,
    //   sameSite: "lax",
    // });
    return res.redirect(`${process.env.FRONTEND_URL}/oauth/success?userId=${user._id}`);
  } catch (err) {
    console.error("Airtable OAuth Error:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function getBases(req, res) {
  try {
    const user = await getUser(req);
    const bases = await listBases(user);
    res.json(bases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getTables(req, res) {
  try {
    const user = await getUser(req);
    const tables = await listTables(user, req.params.baseId);
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getFields(req, res) {
  try {
    const user = await getUser(req);
    const fields = await listFields(
      user,
      req.params.baseId,
      req.params.tableId
    );

    const allowedTypes = [
      "singleLineText",
      "multilineText",
      "singleSelect",
      "multipleSelects",
      "multipleAttachments",
    ];

    const filtered = fields.filter((f) => allowedTypes.includes(f.type));
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
