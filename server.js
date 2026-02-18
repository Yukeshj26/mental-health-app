import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import admin from "firebase-admin"; 
import apiRoutes from "./routes/index.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Chat from "./models/chat.js";
const app = express();
app.use(express.json());
// Load environment variables
dotenv.config();

// --- 1. CLOUD-READY FIREBASE INITIALIZATION ---
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // For Render: Use the Environment Variable string
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    // For Localhost: Use the local JSON file
    const { default: localKey } = await import("./serviceAccountKey.json", { with: { type: "json" } });
    serviceAccount = localKey;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const app = express();

// Middleware
app.use(cors({ origin: 'https://mental-health-app-ce57a.web.app' }));
app.use(express.static('public', {
  etag: false,
  maxAge: '0'
}));

// --- 2. AUTHENTICATION MIDDLEWARE ---
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Access denied." });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; 
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid session." });
  }
};

// --- 3. DATABASE CONNECTION LOGIC ---
const connectDB = async () => {
  try {
    // Force the use of the environment variable
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
      throw new Error("MONGO_URI is not defined in environment variables!");
    }

    await mongoose.connect(uri);
    console.log("MongoDB Connected ✅");
  } catch (err) {
    console.error("MongoDB Connection Failed ❌", err.message);
    // On Render, we want to know exactly what the URI was (optional/for debugging)
    process.exit(1); 
  }
};

// --- 4. API ROUTES ---
app.use("/api", apiRoutes);

// GET History
app.get("/api/chat/history", authenticateToken, async (req, res) => {
    try {
        const chatHistory = await Chat.findOne({ userId: req.user.uid });
        res.json(chatHistory ? chatHistory.messages : []);
    } catch (err) {
        res.status(500).json({ error: "Could not retrieve history." });
    }
});

// POST Chat
app.post("/chat", authenticateToken, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.uid;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // Note: Ensure this model name is correct for your tier
      systemInstruction: "You are a professional Mental Well-being Assistant. Be empathetic and concise."
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    await Chat.findOneAndUpdate(
        { userId: userId }, 
        { 
            $push: { 
                messages: [
                    { sender: 'user', text: message },
                    { sender: 'bot', text: responseText }
                ] 
            } 
        },
        { upsert: true, returnDocument: 'after' }
    );

    res.json({ reply: responseText });

  } catch (err) {
    console.error("Gemini Error:", err.message);
    res.status(500).json({ reply: "I'm having trouble connecting to my thoughts." });
  }
});

// --- 5. START SERVER ---
const PORT = process.env.PORT || 5001; 

connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Backend running on port ${PORT} ✅`);
    });
});