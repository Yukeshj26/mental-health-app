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

// --- 2. AUTHENTICATION LISTENER (Fixed Loop) ---
onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname;
    const isLoginPage = currentPage.includes("index.html") || currentPage === "/" || currentPage.endsWith("/");

    if (user) {
        if (isLoginPage) {
            window.location.href = "dashboard.html";
        }
        const nameDisplay = document.getElementById('user-display-name');
        if (nameDisplay) {
            nameDisplay.innerText = user.displayName || user.email.split('@')[0] || "User";
        }
    } else {
        if (!isLoginPage) {
            window.location.href = "index.html";
        }
    }
});

// --- 3. DATA STRUCTURES ---
let isLoginMode = true;

const scales = {
    freq: ["Nearly every day", "More than half the days", "Several days", "Not at all"],
    intensity: ["Severe / Overwhelming", "Moderate", "Mild", "None"],
    agreement: ["Strongly Disagree", "Disagree", "Agree", "Strongly Agree"],
    quality: ["Very Poor / Crisis level", "Poor / Impacting life", "Slightly irregular", "Optimal / Healthy"],
    interest: ["No interest at all", "Very little interest", "Some interest", "Full of interest & passion"],
    appetite: ["Severe disruption (Loss/Overeating)", "Regularly irregular", "Slightly irregular", "Healthy / Balanced"]
};

const mentalHealthQuestions = [
    { q: "How would you rate your interest or pleasure in doing things lately?", cat: "mood", weight: 1.5, type: "interest" },
    { q: "Feeling down, depressed, or hopeless?", cat: "mood", weight: 2.0, type: "intensity" },
    { q: "Feeling irritable or 'on edge'?", cat: "mood", weight: 1.0, type: "intensity" },
    { q: "Ability to relax during your free time?", cat: "mood", weight: 1.0, type: "freq" },
    { q: "Ability to manage daily responsibilities without feeling overwhelmed?", cat: "mood", weight: 1.0, type: "intensity" },
    { q: "How would you rate your sleep quality over the last week?", cat: "physical", weight: 1.2, type: "quality" },
    { q: "How has your appetite and nutritional balance been?", cat: "physical", weight: 1.0, type: "appetite" },
    { q: "Energy levels and freedom from fatigue?", cat: "physical", weight: 1.0, type: "freq" },
    { q: "Freedom from stress-related physical pain (headaches/tension)?", cat: "physical", weight: 1.2, type: "freq" },
    { q: "Ability to concentrate on tasks like reading or TV?", cat: "physical", weight: 1.0, type: "intensity" },
    { q: "Comfort and frequency of social interactions?", cat: "social", weight: 1.2, type: "freq" },
    { q: "I feel consistently supported by the people in my life.", cat: "social", weight: 1.0, type: "agreement" },
    { q: "I am consistent with my self-care routines.", cat: "social", weight: 1.0, type: "agreement" },
    { q: "Feeling connected to others (freedom from loneliness)?", cat: "social", weight: 1.3, type: "freq" },
    { q: "Ability to be your authentic self (not performing 'happy')?", cat: "social", weight: 1.3, type: "freq" },
    { q: "I feel confident in my ability to handle my problems.", cat: "outlook", weight: 1.2, type: "agreement" },
    { q: "Freedom from excessive worry about things out of my control?", cat: "outlook", weight: 1.2, type: "freq" },
    { q: "I feel a strong sense of purpose in my daily life.", cat: "outlook", weight: 1.5, type: "agreement" },
    { q: "Mental clarity and freedom from 'brain fog'?", cat: "outlook", weight: 1.0, type: "freq" },
    { q: "I am hopeful about what my future holds.", cat: "outlook", weight: 2.0, type: "agreement" }
];

// --- 4. CORE FUNCTIONS ---
const toggleAuthMode = function() {
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
        if (percentage === 100) fill.style.background = "#2ecc71";
    }

    // Fixed Back to Top visibility
    if (topBtn) {
        if (percentage >= 30) {
            topBtn.classList.add('show');
        } else {
            topBtn.classList.remove('show');
        }
    }
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
        btn.innerText = "Processing...";
        btn.disabled = true;

        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "dashboard.html"; 
        } else {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const idToken = await user.getIdToken();
            await fetch("https://mental-health-app-2vww.onrender.com/api/auth/signup-db", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken, name })
            });
            alert("Account created successfully!");
            window.location.href = "dashboard.html";
        }
    } catch (err) { 
        alert(err.message); 
    } finally {
        btn.innerText = isLoginMode ? "Login" : "Create Account";
        btn.disabled = false;
    }
};

window.calculateComplexScore = () => {
    let earnedPoints = 0;
    let maxPoints = 0;
    let unanswered = false;

    mentalHealthQuestions.forEach((item, index) => {
        const selected = document.querySelector(`input[name="q-${index}"]:checked`);
        if (selected) {
            earnedPoints += (parseInt(selected.value) * item.weight);
            maxPoints += (3 * item.weight);
        } else {
            unanswered = true;
        }
    });

    if (unanswered) {
        alert("Please answer all questions.");
        return;
    }

    const finalPercentage = (earnedPoints / maxPoints) * 100;
    const display = document.getElementById("result-display");
    if (display) {
        display.style.display = "block";
        let status, color, bgColor;
        if (finalPercentage > 80) { status = "Excellent 🌟"; color = "#2ecc71"; bgColor = "#e8f8f0"; }
        else if (finalPercentage > 60) { status = "Good 🌿"; color = "#3498db"; bgColor = "#ebf5fb"; }
        else if (finalPercentage > 40) { status = "Fair ⚠️"; color = "#f39c12"; bgColor = "#fef9e7"; }
        else { status = "Support Recommended ❤️"; color = "#e74c3c"; bgColor = "#fdedec"; }

        display.style.backgroundColor = bgColor;
        display.style.border = `2px solid ${color}`;
        display.style.padding = "20px";
        display.style.borderRadius = "15px";
        display.innerHTML = `<h1 style="color: ${color}">${finalPercentage.toFixed(0)}%</h1><h3>${status}</h3>`;
    }
};

window.sendMessage = async function() {
    const input = document.getElementById("userInput");
    const msg = input.value?.trim();
    
    // Safety check: ensure user is logged in
    const user = auth.currentUser;
    if (!msg || !user) {
        if (!user) addMsg("Bot", "Please sign in to use the assistant.", "bot-msg");
        return;
    }

    addMsg("You", msg, "user-msg");
    input.value = "";

    try {
        // Force refresh the token to avoid 403 Forbidden errors
        const token = await user.getIdToken(true); 

        const res = await fetch("https://mental-health-app-2vww.onrender.com/chat", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ message: msg })
        });

        if (!res.ok) {
            throw new Error(`Server responded with ${res.status}`);
        }

        const data = await res.json();
        // Handle different potential JSON response keys
        const botReply = data.reply || data.message || data.response;
        
        if (botReply) {
            addMsg("Bot", botReply, "bot-msg");
        } else {
            addMsg("Bot", "I received an empty response. Please try again.", "bot-msg");
        }

    } catch (err) { 
        console.error("Chat Error:", err);
        addMsg("Bot", "Connection error. The server may be waking up—please try again in a moment.", "bot-msg"); 
    }
};
window.findNearbyClinics = () => {
    const query = encodeURIComponent("psychiatrist near me");
    const mapUrl = `https://www.google.com/maps/search/${query}`;
    window.open(mapUrl, '_blank');
};
const goToChat = () => {
    window.location.href = "ai-chat.html";
};

// --- 5. PAGE INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
    const qContainer = document.getElementById("questions-container");
    if (!qContainer) return;

    const categories = { mood: "Mood 🧠", physical: "Physical ⚡", social: "Social 🤝", outlook: "Outlook 🌅" };
    qContainer.innerHTML = "";

    Object.keys(categories).forEach(catKey => {
        const header = document.createElement("h3");
        header.className = "category-header";
        header.innerText = categories[catKey];
        qContainer.appendChild(header);

        mentalHealthQuestions.forEach((item, index) => {
            if (item.cat === catKey) {
                const div = document.createElement("div");
                div.className = "question-card";
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
                    </div>`;
                div.addEventListener('change', window.updateProgressBar);
                qContainer.appendChild(div);
            }
        });
    });
});

// --- 6. EXPORTS ---
window.toggleAuthMode = toggleAuthMode;
window.handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    window.location.href = "index.html";
};
window.goToChat = () => {
    window.location.href = "ai-chat.html";
};

window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
};
window.calculateComplexScore = calculateComplexScore;
window.sendMessage = sendMessage;
window.startVoice = startVoice;
window.toggleDarkMode = toggleDarkMode;
window.goToChat = goToChat;
window.findNearbyClinics = () => {
    // Standard Google Maps search query for mental health professionals
    const query = encodeURIComponent("psychiatrist near me");
    const mapUrl = `https://www.google.com/maps/search/${query}`;
    window.open(mapUrl, '_blank');
};