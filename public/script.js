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
onAuthStateChanged(auth, async (user) => {
    const path = window.location.pathname;
    const isAuthPage = path.includes("index.html") || path === "/" || path.endsWith("/");

    if (user) {
        const idToken = await user.getIdToken();
        localStorage.setItem("token", idToken);
        if (isAuthPage) window.location.href = "dashboard.html";
    } else {
        localStorage.removeItem("token");
        if (path.includes("dashboard.html") || path.includes("ai-chat.html")) {
            window.location.href = "index.html";
        }
    }
});

// --- 3. DATA STRUCTURES ---
let isLoginMode = true;

const scales = {
    freq: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    qual: ["Very Good", "Fair", "Poor", "Very Poor"],
    agree: ["Strongly Agree", "Agree", "Disagree", "Strongly Disagree"]
};

const mentalHealthQuestions = [
    { q: "Little interest or pleasure in doing things?", cat: "mood", weight: 1.5, type: "freq" },
    { q: "Feeling down, depressed, or hopeless?", cat: "mood", weight: 1.5, type: "freq" },
    { q: "Feeling irritable or 'on edge'?", cat: "mood", weight: 1.0, type: "freq" },
    { q: "Difficult to relax in free time?", cat: "mood", weight: 1.0, type: "freq" },
    { q: "Overwhelmed by daily responsibilities?", cat: "mood", weight: 1.0, type: "freq" },
    { q: "How would you rate your sleep quality?", cat: "physical", weight: 1.2, type: "qual" },
    { q: "Significant change in your appetite?", cat: "physical", weight: 1.0, type: "qual" },
    { q: "Feeling tired or having little energy?", cat: "physical", weight: 1.0, type: "freq" },
    { q: "Stress-related physical pain?", cat: "physical", weight: 1.2, type: "freq" },
    { q: "Hard to concentrate on reading/TV?", cat: "physical", weight: 1.0, type: "freq" },
    { q: "Avoiding social interactions?", cat: "social", weight: 1.2, type: "freq" },
    { q: "Do you feel supported by people?", cat: "social", weight: -1.0, type: "agree" },
    { q: "Consistent with self-care routines?", cat: "social", weight: -1.0, type: "agree" },
    { q: "Feeling lonely even when around others?", cat: "social", weight: 1.3, type: "freq" },
    { q: "Performing a 'happy' version of yourself?", cat: "social", weight: 1.3, type: "freq" },
    { q: "Confident in ability to handle problems?", cat: "outlook", weight: -1.2, type: "agree" },
    { q: "Worrying excessively about control?", cat: "outlook", weight: 1.2, type: "freq" },
    { q: "Feeling a sense of purpose?", cat: "outlook", weight: -1.5, type: "agree" },
    { q: "Experiencing 'brain fog'?", cat: "outlook", weight: 1.0, type: "freq" },
    { q: "Hopeful about your future?", cat: "outlook", weight: -1.5, type: "agree" }
];

// --- 4. CORE FUNCTIONS ---

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

    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();
            await fetch("http://localhost:5001/api/auth/signup-db", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken, name })
            });
            alert("Account created!");
        }
    } catch (err) { alert(err.message); }
};

window.calculateComplexScore = () => {
    let totalScore = 0;
    let unanswered = false;

    mentalHealthQuestions.forEach((_, index) => {
        const selected = document.querySelector(`input[name="q-${index}"]:checked`);
        if (selected) {
            const val = parseInt(selected.value);
            const weight = mentalHealthQuestions[index].weight;
            totalScore += (val * weight);
        } else {
            unanswered = true;
        }
    });

    if (unanswered) {
        alert("Please answer all questions before analyzing.");
        return;
    }

    let condition = totalScore < 10 ? "Resilient 🌿" : totalScore < 25 ? "Stressed ⚠️" : "High Load ❤️";
    const display = document.getElementById("result-display");
    if (display) {
        display.style.display = "block";
        display.innerHTML = `<h3>Condition: ${condition}</h3><p>Weighted Score: ${totalScore.toFixed(1)}</p>`;
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
window.toggleAuthMode = toggleAuthMode;
window.handleLogout = () => {
    // 1. Clear local data so the next session starts fresh
    localStorage.clear(); 
    sessionStorage.clear();
    
    // 2. Sign out from Firebase
    signOut(auth).then(() => {
        // 3. Redirect back to the login page
        window.location.href = "index.html";
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
};
window.toggleDarkMode = () => document.body.classList.toggle("dark");
window.goToChat = () => window.location.href = "ai-chat.html";
window.calculateComplexScore = calculateComplexScore;
window.sendMessage = sendMessage;
window.startVoice = startVoice;

console.log("Global functions attached successfully ✅");