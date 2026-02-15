import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    userId: { 
        type: String, // Storing the Firebase UID
        required: true,
        index: true 
    },
    messages: [
        {
            sender: { type: String, enum: ['user', 'bot'], required: true },
            text: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

export default mongoose.model("Chat", chatSchema);