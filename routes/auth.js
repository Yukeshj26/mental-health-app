import express from "express";
import admin from "firebase-admin";
import User from "../models/User.js"; // Import the schema you just created

const router = express.Router();

/**
 * POST /api/auth/signup-db
 * Syncs the authenticated Firebase user into your MongoDB.
 */
router.post("/signup-db", async (req, res) => {
    const { idToken, name } = req.body;

    try {
        // 1. Verify the token provided by the frontend
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email } = decodedToken;

        // 2. Map Firebase data to your MongoDB User Schema
        const user = await User.findOneAndUpdate(
            { firebaseUid: uid }, // Match based on the UID
            { 
                firebaseUid: uid, 
                name: name, 
                email: email 
            },
            { upsert: true, returnDocument: 'after' } // Create if not exists, return the new document
        );

        res.status(201).json({ 
            message: "User synced to database ✅", 
            user: { name: user.name, email: user.email } 
        });

    } catch (err) {
        console.error("Auth Sync Error:", err.message);
        res.status(500).json({ error: "Failed to sync user with database." });
    }
});

export default router;