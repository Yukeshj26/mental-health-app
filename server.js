import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import admin from "firebase-admin"; 
import apiRoutes from "./routes/index.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Chat from "./models/Chat.js";

// Load environment variables
dotenv.config();

// 1. Initialize Firebase Admin SDK
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public', {
  etag: false,
  maxAge: '0'
}));

// 2. Authentication Middleware
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

// 3. Database Connection Logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");
  } catch (err) {
    console.error("MongoDB Connection Failed ❌", err.message);
    process.exit(1); 
  }
};

// 4. API Routes
app.use("/api", apiRoutes);

/**
 * GET /api/chat/history
 * Defined before the server starts to ensure the route is registered.
 */
app.get("/api/chat/history", authenticateToken, async (req, res) => {
    try {
        const chatHistory = await Chat.findOne({ userId: req.user.uid });
        res.json(chatHistory ? chatHistory.messages : []);
    } catch (err) {
        res.status(500).json({ error: "Could not retrieve history." });
    }
});

/**
 * POST /chat
 * AI conversation and persistence logic.
 */
app.post("/chat", authenticateToken, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.uid;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      systemInstruction: "You are a professional Mental Well-being Assistant. Be empathetic and concise."
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    // Persist to MongoDB
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

// 5. Start Server
// This is the industry standard for deployment
const PORT = process.env.PORT || 5001; 

connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Backend running on port ${PORT} ✅`);
    });
});