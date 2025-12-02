// --- 1. IMPORTS (Auth + Firestore Database) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// --- 2. YOUR CONFIGURATION (ALREADY FILLED) ---
const firebaseConfig = {
    apiKey: "AIzaSyB-fZTbZqNOJyPZhtnT8v0EiRb5XhCFzP0",
    authDomain: "gem-edit.firebaseapp.com",
    projectId: "gem-edit",
    storageBucket: "gem-edit.firebasestorage.app",
    messagingSenderId: "586824444534",
    appId: "1:586824444534:web:4fe781be673c7edcfb8d57",
    measurementId: "G-BTCENT5HEK"
};

// --- 3. INITIALIZATION ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Database
const provider = new GoogleAuthProvider();

// Global State
let currentUser = null;
let currentProjectId = null;
let selectedElement = null;

// --- 4. AUTH & NAVIGATION ---
const els = {
    auth: document.getElementById('auth-screen'),
    dash: document.getElementById('dashboard'),
    editor: document.getElementById('editor'),
    loginBtn: document.getElementById('google-login-btn'),
    logoutBtn: document.getElementById('logout-btn-dash'),
    dashName: document.getElementById('dash-name'),
    dashPfp: document.getElementById('dash-pfp')
};

// Login Logic
if(els.loginBtn) {
    els.loginBtn.addEventListener('click', () => {
        signInWithPopup(auth, provider).catch(e => {
            console.error(e);
            alert("Login Failed: " + e.message);
        });
    });
}

// Logout Logic
if(els.logoutBtn) {
    els.logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => location.reload());
    });
}

// Auth State Listener (The Router)
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User detected:", user.email);
        currentUser = user;
        
        // Switch Screens
        if(els.auth) els.auth.classList.add('hidden');
        if(els.dash) els.dash.classList.remove('hidden');
        
        // Update Dashboard Info
        if(els.dashName) els.dashName.textContent = user.displayName;
        if(els.dashPfp) els.dashPfp.src = user.photoURL;
        
        loadProjects(); // Load projects from DB
    } else {
        // Show Login Screen
        if(els.auth) els.auth.classList.remove('hidden');
        if(els.dash) els.dash.classList.add('hidden');
        if(els.editor) els.editor.classList.add('hidden');
    }
});

// --- 5. DASHBOARD & PROJECTS (Firestore) ---

// Load Projects Function
async function loadProjects() {
    const list = document.getElementById('projects-list');
    const newBtn = document.getElementById('new-project-btn');
    
    if(!list || !newBtn) return;

    // Clear list but save the "New Project" button
    list.innerHTML = ''; 
    list.appendChild(newBtn); 

    try {
        const q = await getDocs(collection(db, `users/${currentUser.uid}/projects`));
        q.forEach((docSnap) => {
            const data = docSnap.data();
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <h3>${data.name}</h3>
                <p style="font-size:0.8rem; color:#666">Matter Composition</p>
                <button class="delete-proj" data-id="${docSnap.id}">Delete</button>
            `;
            
            // Click to Open
            card.addEventListener('click', (e) => {
                if(!e.target.classList.contains('delete-proj')) openProject(docSnap.id, data);
            });
            
            // Click to Delete
            const delBtn = card.querySelector('.delete-proj');
            delBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Stop it from opening the project
                if(confirm('Delete Project?')) {
                    await deleteDoc(doc(db, `users/${currentUser.uid}/projects`, docSnap.id));
                    loadProjects(); // Refresh
                }
            });

            list.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading projects:", error);
        // If this fails, it usually means Firestore isn't enabled in the console yet
    }
}

// Create New Project Listener
const newProjectBtn = document.getElementById('new-project-btn');
if(newProjectBtn) {
    newProjectBtn.addEventListener('click', async () => {
        const name = prompt("Name your composition:", "Untitled Matter");
        if(!name) return;

        try {
            const docRef = await addDoc(collection(db, `users/${currentUser.uid}/projects`), {
                name: name,
                createdAt: new Date().toISOString(),
                layers: [] // Start empty
            });
            
            openProject(docRef.id, { name: name });
        } catch (error) {
            alert("Error creating project. Did you enable Firestore Database in the Firebase Console?");
        }
    });
}

// Open Project Logic
function openProject(id, data) {
    currentProjectId = id;
    const titleEl = document.getElementById('project-title');
    if(titleEl) titleEl.value = data.name;

    if(els.dash) els.dash.classList.add('hidden');
    if(els.editor) els.editor.classList.remove('hidden');
    
    const stage = document.getElementById('canvas-stage');
    if(stage) stage.innerHTML = ''; // Clear stage
}

// Back to Dashboard Button
const backBtn = document.getElementById('back-to-dash');
if(backBtn) {
    backBtn.addEventListener('click', () => {
        if(els.editor) els.editor.classList.add('hidden');
        if(els.dash) els.dash.classList.remove('hidden');
        loadProjects();
    });
}

// --- 6. EDITOR ENGINE (Effects, Code, Drag) ---

// Tab Switching
document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab, .tab-content').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
        const content = document.getElementById(`tab-${btn.dataset.tab}`);
        if(content) content.classList.add('active');
    });
});

// File Upload Logic
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-upload');

if(dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        Array.from(e.target.files).forEach(file => {
            const url = URL.createObjectURL(file);
            createLayer(url, file.type.includes('video') ? 'video' : 'image');
        });
    });
}

// Global Create Layer Function (Used by Uploads + Stock)
window.createLayer = function(url, type) {
    const stage = document.getElementById('canvas-stage');
    if(!stage) return;

    const el = document.createElement(type === 'video' ? 'video' : 'img');
    el.src = url;
    el.classList.add('layer-element');
    el.style.width = '300px';
    el.style.top = '100px';
    el.style.left = '100px';
    
    // Video settings
    if(type === 'video') { 
        el.loop = true; 
        el.muted = true; 
        el.play(); 
    }
    
    // Interactions
    makeDraggable(el);
    el.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Don't drag the stage
        selectLayer(el);
    });
    
    stage.appendChild(el);
};

// Selection & Properties Logic
function selectLayer(el) {
    selectedElement = el;
    
    // Visual Selection
    document.querySelectorAll('.layer-element').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    
    // Load Properties UI
    const panel = document.getElementById('active-prop-panel');
    const template = document.getElementById('prop-template');
    
    if(panel && template) {
        panel.innerHTML = '';
        panel.appendChild(template.content.cloneNode(true));

        // Bind Inputs (Opacity, Blur, Hue)
        panel.querySelectorAll('.prop-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const val = e.target.value;
                const prop = e.target.dataset.prop;
                
                // Real-time CSS updates
                if(prop === 'opacity') el.style.opacity = val;
                
                // Complex Filters
                if(prop === 'blur' || prop === 'hue') {
                    const blurVal = panel.querySelector('[data-prop="blur"]').value;
                    const hueVal = panel.querySelector('[data-prop="hue"]').value;
                    el.style.filter = `blur(${blurVal}px) hue-rotate(${hueVal}deg)`;
                }
            });
        });

        // CODE INJECTION (The Magic Sandbox)
        const runBtn = panel.querySelector('.run-code-btn');
        const codeBox = panel.querySelector('.code-editor');
        
        if(runBtn && codeBox) {
            runBtn.addEventListener('click', () => {
                const userCode = codeBox.value;
                try {
                    // Create a function with 'el' as the argument
                    const func = new Function('el', userCode);
                    func(el); // Run it on the selected element
                    alert('System: Code Executed Successfully');
                } catch(err) {
                    alert('Syntax Error: ' + err.message);
                }
            });
        }
    }
}

// Draggable Physics Engine
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
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        element.style.left = `${initialLeft + dx}px`;
        element.style.top = `${initialTop + dy}px`;
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        element.style.cursor = 'grab';
    });
}
