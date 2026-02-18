// --- 1. FIREBASE INITIALIZATION ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyD3dcSdmyfWedD8X6_Iiu9B2Hcn2zPkYFQ",
    authDomain: "mental-health-app-ce57a.firebaseapp.com",
    projectId: "mental-health-app-ce57a",
    storageBucket: "mental-health-app-ce57a.firebasestorage.app",
    messagingSenderId: "607497978069",
    appId: "1:607497978069:web:59b1d7b2e8a676d4a8e25c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- 2. AUTHENTICATION LISTENER ---
// Inside your Firebase Auth listener
auth.onAuthStateChanged((user) => {
    if (user) {
        const nameDisplay = document.getElementById('user-display-name');
        if (nameDisplay) {
            // Priority: Display Name -> Email (before @) -> Guest
            nameDisplay.innerText = user.displayName || user.email.split('@')[0] || "User";
        }
    } else {
        window.location.href = "index.html"; // Redirect if not logged in
    }
});

// --- 3. DATA STRUCTURES ---
let isLoginMode = true;

const scales = {
    // Bad (0) -> Good (3)
    freq: ["Nearly every day", "More than half the days", "Several days", "Not at all"],
    intensity: ["Severe / Overwhelming", "Moderate", "Mild", "None"],
    agreement: ["Strongly Disagree", "Disagree", "Agree", "Strongly Agree"],
    quality: ["Very Poor / Crisis level", "Poor / Impacting life", "Slightly irregular", "Optimal / Healthy"],
    
    // Custom Scale for Question 1
    interest: ["No interest at all", "Very little interest", "Some interest", "Full of interest & passion"],
    
    // Custom Scale for Question 7
    appetite: ["Severe disruption (Loss/Overeating)", "Regularly irregular", "Slightly irregular", "Healthy / Balanced"]
};

const mentalHealthQuestions = [
    // --- MOOD ---
    { q: "How would you rate your interest or pleasure in doing things lately?", cat: "mood", weight: 1.5, type: "interest" }, // Q1 Updated
    { q: "Feeling down, depressed, or hopeless?", cat: "mood", weight: 2.0, type: "intensity" },
    { q: "Feeling irritable or 'on edge'?", cat: "mood", weight: 1.0, type: "intensity" },
    { q: "Ability to relax during your free time?", cat: "mood", weight: 1.0, type: "freq" },
    { q: "Ability to manage daily responsibilities without feeling overwhelmed?", cat: "mood", weight: 1.0, type: "intensity" },
    
    // --- PHYSICAL ---
    { q: "How would you rate your sleep quality over the last week?", cat: "physical", weight: 1.2, type: "quality" },
    { q: "How has your appetite and nutritional balance been?", cat: "physical", weight: 1.0, type: "appetite" }, // Q7 Updated
    { q: "Energy levels and freedom from fatigue?", cat: "physical", weight: 1.0, type: "freq" },
    { q: "Freedom from stress-related physical pain (headaches/tension)?", cat: "physical", weight: 1.2, type: "freq" },
    { q: "Ability to concentrate on tasks like reading or TV?", cat: "physical", weight: 1.0, type: "intensity" },
    
    // --- SOCIAL ---
    { q: "Comfort and frequency of social interactions?", cat: "social", weight: 1.2, type: "freq" },
    { q: "I feel consistently supported by the people in my life.", cat: "social", weight: 1.0, type: "agreement" },
    { q: "I am consistent with my self-care routines.", cat: "social", weight: 1.0, type: "agreement" },
    { q: "Feeling connected to others (freedom from loneliness)?", cat: "social", weight: 1.3, type: "freq" },
    { q: "Ability to be your authentic self (not performing 'happy')?", cat: "social", weight: 1.3, type: "freq" },
    
    // --- OUTLOOK ---
    { q: "I feel confident in my ability to handle my problems.", cat: "outlook", weight: 1.2, type: "agreement" },
    { q: "Freedom from excessive worry about things out of my control?", cat: "outlook", weight: 1.2, type: "freq" },
    { q: "I feel a strong sense of purpose in my daily life.", cat: "outlook", weight: 1.5, type: "agreement" },
    { q: "Mental clarity and freedom from 'brain fog'?", cat: "outlook", weight: 1.0, type: "freq" },
    { q: "I am hopeful about what my future holds.", cat: "outlook", weight: 2.0, type: "agreement" }
];
// --- 4. CORE FUNCTIONS ---
window.updateProgressBar = () => {
    const totalQuestions = mentalHealthQuestions.length;
    const answeredQuestions = document.querySelectorAll('.health-q-radio:checked').length;
    const percentage = Math.round((answeredQuestions / totalQuestions) * 100);

    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    const topBtn = document.getElementById('back-to-top');

    if (fill && text) {
        fill.style.width = `${percentage}%`;
        text.innerText = `${percentage}%`;
    if (topBtn) {
        if (percentage >= 30) { // Shows up after 40% progress
            topBtn.style.display = "flex";
            topBtn.style.opacity = "0";
        } else {
            topBtn.classList.remove('show');
        }
    }
    if (percentage === 100) {
            fill.style.background = "#2ecc71";
        }
    }
};

window.toggleAuthMode = function() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById("auth-title");
    const regName = document.getElementById("reg-name");
    const btn = document.getElementById("auth-btn");
    const toggleLink = document.getElementById("toggle-link");

    if (title) title.innerText = isLoginMode ? "Welcome Back" : "Join Us";
    if (regName) regName.style.display = isLoginMode ? "none" : "block";
    if (btn) btn.innerText = isLoginMode ? "Login" : "Create Account";
    if (toggleLink) toggleLink.innerText = isLoginMode ? "Sign Up" : "Login";
};

window.handleAuth = async function() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const name = document.getElementById("reg-name")?.value || "User";
    const btn = document.getElementById("auth-btn");

    if (!email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        btn.innerText = "Processing..."; // Give user feedback
        btn.disabled = true;

        if (isLoginMode) {
            // 1. ATTEMPT LOGIN
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Login successful!");
            // 2. REDIRECT MANUALLY (Since your listener might be slow)
            window.location.href = "dashboard.html"; 
        } else {
            // 1. ATTEMPT SIGNUP
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. SEND TO YOUR DATABASE (Optional but recommended)
            try {
                const idToken = await user.getIdToken();
                await fetch("https://mental-health-app-2vww.onrender.com/api/auth/signup-db", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ idToken, name })
                });
            } catch (dbErr) {
                console.warn("DB update failed, but user created in Firebase.");
            }

            alert("Account created successfully!");
            window.location.href = "dashboard.html";
        }
    } catch (err) { 
        // Handles: "wrong-password", "user-not-found", "email-already-in-use"
        console.error("Auth Error:", err.code);
        alert(err.message); 
    } finally {
        btn.innerText = isLoginMode ? "Login" : "Create Account";
        btn.disabled = false;
    }
};

window.findNearbyClinics = () => {
    // This query searches for psychiatrists near the user's current GPS/IP location
    const mapUrl = "https://www.google.com/maps/search/psychiatrist+near+me/";
    window.open(mapUrl, '_blank');
};

window.calculateComplexScore = () => {
    let earnedPoints = 0;
    let maxPoints = 0;
    let unanswered = false;

    mentalHealthQuestions.forEach((item, index) => {
        const selected = document.querySelector(`input[name="q-${index}"]:checked`);
        if (selected) {
            const val = parseInt(selected.value); // 0, 1, 2, or 3
            earnedPoints += (val * item.weight);
            maxPoints += (3 * item.weight); // Max possible is Level 3
        } else {
            unanswered = true;
        }
    });

    if (unanswered) {
        alert("Please answer all questions before analyzing.");
        return;
    }

    const finalPercentage = (earnedPoints / maxPoints) * 100;
    
    const display = document.getElementById("result-display");
    if (display) {
        display.style.display = "block";
        
        // --- DYNAMIC COLOR LOGIC ---
        let status, color, bgColor;
        if (finalPercentage > 80) { 
            status = "Excellent - Thriving 🌟"; color = "#2ecc71"; bgColor = "#e8f8f0";
        } else if (finalPercentage > 60) { 
            status = "Good - Resilient 🌿"; color = "#3498db"; bgColor = "#ebf5fb";
        } else if (finalPercentage > 40) { 
            status = "Fair - Moderate Stress ⚠️"; color = "#f39c12"; bgColor = "#fef9e7";
        } else { 
            status = "Seeking Support Recommended ❤️"; color = "#e74c3c"; bgColor = "#fdedec";
        }

        // Apply styles directly to the result box
        display.style.backgroundColor = bgColor;
        display.style.border = `2px solid ${color}`;
        display.style.borderRadius = "15px";
        display.style.padding = "20px";
        display.style.color = "#333"; // Ensure text is dark inside the light colored box

        display.innerHTML = `
            <div style="text-align: center;">
                <h1 style="color: ${color}; font-size: 3rem; margin: 0;">${finalPercentage.toFixed(0)}%</h1>
                <p style="text-transform: uppercase; font-weight: bold; color: ${color};">Mental Health Index</p>
                <hr style="border: 0; border-top: 1px solid ${color}; opacity: 0.3; margin: 15px 0;">
                <h3 style="margin-bottom: 5px;">${status}</h3>
                <p style="font-size: 0.9rem;">${finalPercentage > 50 ? "Keep maintaining your positive routines!" : "Consider reaching out to a professional or the helpline above."}</p>
            </div>
        `;
    }
};
window.sendMessage = async function() {
    const input = document.getElementById("userInput");
    const msg = input.value?.trim();
    const token = localStorage.getItem("token");
    if (!msg || !token) return;

    addMsg("You", msg, "user-msg");
    input.value = "";

    try {
        const res = await fetch("https://mental-health-app-2vww.onrender.com/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ message: msg })
        });
        const data = await res.json();
        addMsg("Bot", data.reply, "bot-msg");
    } catch (err) { addMsg("Bot", "Server Error.", "bot-msg"); }
};

function addMsg(sender, text, className) {
    const chatbox = document.getElementById("chatbox");
    if (!chatbox) return;
    const msg = document.createElement("p");
    msg.className = className;
    msg.innerHTML = `<b>${sender}:</b> ${text}`;
    chatbox.appendChild(msg);
    chatbox.scrollTop = chatbox.scrollHeight;
}

async function loadChatHistory() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
        const res = await fetch("https://mental-health-app-2vww.onrender.com/api/chat/history", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const messages = await res.json();
        messages.forEach(msg => addMsg(msg.sender === 'user' ? "You" : "Bot", msg.text, `${msg.sender}-msg`));
    } catch (err) { console.error(err); }
}
window.startVoice = () => {
    // Check if browser supports speech
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Voice recognition not supported in this browser.");
        return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        document.getElementById("userInput").value = transcript;
    };
    recognition.start();
};
// --- 5. PAGE INITIALIZATION (Updated) ---
window.addEventListener('DOMContentLoaded', () => {
    const qContainer = document.getElementById("questions-container");
    if (!qContainer) return;

    // Grouping questions by category
    const categories = {
        mood: "Depression & Mood 🧠",
        physical: "Physical & Cognitive ⚡",
        social: "Social & Connection 🤝",
        outlook: "Future & Outlook 🌅"
    };

    // Clear container first
    qContainer.innerHTML = "";

    Object.keys(categories).forEach(catKey => {
        // Add Category Header
        const header = document.createElement("h3");
        header.className = "category-header";
        header.innerText = categories[catKey];
        qContainer.appendChild(header);

        // Filter and render questions for this category
        mentalHealthQuestions.forEach((item, index) => {
            if (item.cat === catKey) {
                const div = document.createElement("div");
                div.className = "question-card";
                
                // Get the scale labels for this question type
                const labels = scales[item.type];

                div.innerHTML = `
                    <p class="question-text">${index + 1}. ${item.q}</p>
                    <div class="levels-wrapper">
                        ${labels.map((opt, i) => `
                            <label class="level-box">
                                <input type="radio" name="q-${index}" value="${i}" class="health-q-radio" required>
                                <span class="level-num">Level ${i}</span>
                                <span class="level-desc">${opt}</span>
                            </label>
                        `).join('')}
                    </div>
                `;
                div.addEventListener('change', window.updateProgressBar);
                qContainer.appendChild(div);
            }
        });
    });
    // 2. LOAD HISTORY IF ON CHAT PAGE
    const chatbox = document.getElementById("chatbox");
    if (chatbox && window.location.pathname.includes("ai-chat.html")) {
        loadChatHistory();
    }
});


// --- 6. EXPLICIT GLOBAL EXPORTS ---
// This section allows your HTML "onclick" events to find the functions
window.handleAuth = handleAuth;
window.findNearbyClinics = () => {
    const mapUrl = "https://www.google.com/maps/search/psychiatrist+near+me/";
    window.open(mapUrl, '_blank');
};
window.toggleAuthMode = toggleAuthMode;
// Ensure this is in your script.js (Section 4 or Global Exports)
window.handleLogout = async () => {
    try {
        // 1. Clear local data
        localStorage.clear();
        sessionStorage.clear();
        
        // 2. Firebase Sign Out
        await auth.signOut();
        
        // 3. Redirect to login
        window.location.href = "index.html";
    } catch (error) {
        console.error("Logout Error:", error);
        alert("Logout failed. Please try again.");
    }
};
window.toggleDarkMode = () => document.body.classList.toggle("dark");
window.goToChat = () => window.location.href = "ai-chat.html";
window.calculateComplexScore = calculateComplexScore;
window.sendMessage = sendMessage;
window.startVoice = startVoice;

console.log("Global functions attached successfully ✅");