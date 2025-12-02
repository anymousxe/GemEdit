// --- 1. FIREBASE IMPORTS (Using your version 12.6.0) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// --- 2. YOUR CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyB-fZTbZqNOJyPZhtnT8v0EiRb5XhCFzP0",
    authDomain: "gem-edit.firebaseapp.com",
    projectId: "gem-edit",
    storageBucket: "gem-edit.firebasestorage.app",
    messagingSenderId: "586824444534",
    appId: "1:586824444534:web:4fe781be673c7edcfb8d57",
    measurementId: "G-BTCENT5HEK"
};

// --- 3. INITIALIZE APP ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

console.log("XRNO Core: Online 🟢");

// --- 4. AUTHENTICATION LOGIC ---
const loginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const authScreen = document.getElementById('auth-screen');
const mainApp = document.getElementById('app');
const userNameDisplay = document.getElementById('user-name');

// Login Function
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("Login Success:", result.user.displayName);
            })
            .catch((error) => {
                console.error("Login Error:", error);
                alert("Login Failed. Did you add this URL to Firebase Authorized Domains?");
            });
    });
}

// Logout Function
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            console.log("User signed out.");
            location.reload(); // Reload to clear the editor
        });
    });
}

// State Monitor (Switches screens automatically)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in: Hide Login, Show Editor
        if(authScreen) authScreen.style.opacity = '0';
        setTimeout(() => {
            if(authScreen) authScreen.classList.add('hidden');
            if(mainApp) mainApp.classList.remove('hidden');
        }, 500);
        if(userNameDisplay) userNameDisplay.textContent = user.displayName;
    } else {
        // User is logged out: Show Login, Hide Editor
        if(authScreen) {
            authScreen.classList.remove('hidden');
            authScreen.style.opacity = '1';
        }
        if(mainApp) mainApp.classList.add('hidden');
    }
});

// --- 5. EDITOR ENGINE (Drag & Drop + Uploads) ---

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-upload');
const canvasStage = document.getElementById('canvas-stage');

// Trigger hidden file input when clicking the box
if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(file){
            // Create a local URL for the file (fast preview)
            const url = URL.createObjectURL(file);
            createLayer(url, file.type);
        }
    });
}

function createLayer(url, type) {
    if (!canvasStage) return;

    // Create the element
    const el = document.createElement(type.includes('video') ? 'video' : 'img');
    el.src = url;
    el.classList.add('layer-element');
    
    // Default styling
    el.style.width = '300px';
    el.style.position = 'absolute'; // Critical for dragging
    el.style.top = '100px';
    el.style.left = '100px';
    el.style.cursor = 'grab';
    
    // Auto-play if it's a video
    if(type.includes('video')) { 
        el.loop = true; 
        el.muted = true; // Browser requires mute to autoplay
        el.play(); 
    }

    // Add physics
    makeDraggable(el);
    
    // Add to stage
    canvasStage.appendChild(el);
}

// Physics Engine (Draggable Logic)
function makeDraggable(element) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    element.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = element.offsetLeft;
        initialTop = element.offsetTop;
        element.style.cursor = 'grabbing';
        e.preventDefault(); // Stop browser from trying to drag the image file itself
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        // Calculate movement
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        // Apply new position
        element.style.left = `${initialLeft + dx}px`;
        element.style.top = `${initialTop + dy}px`;
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        element.style.cursor = 'grab';
    });
}
