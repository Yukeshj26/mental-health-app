import express from "express";
import admin from "firebase-admin";
import mongoose from "mongoose";

const router = express.Router();

// Define a User Schema if you haven't yet
const UserSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);

/**
 * POST /api/auth/signup-db
 * Syncs Firebase User with MongoDB
 */
router.post("/signup-db", async (req, res) => {
    const { idToken, name } = req.body;

    try {
        // 1. Verify the token with Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email } = decodedToken;

        // 2. Save or Update user in MongoDB
        const user = await User.findOneAndUpdate(
            { uid: uid },
            { uid, name, email },
            { upsert: true, returnDocument: 'after' }
        );

        console.log(`User synced to MongoDB: ${email} ✅`);
        res.status(201).json({ message: "User synced successfully", user });

    } catch (err) {
        console.error("Signup-DB Error:", err.message);
        res.status(500).json({ error: "Failed to sync user data" });
    }
});

export default router;