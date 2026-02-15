import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // The unique ID from Firebase (User.uid)
  firebaseUid: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: [true, "Name is required"], 
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, "Email is required"], 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  // We removed the 'password' field because Firebase handles it!
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model("User", userSchema);