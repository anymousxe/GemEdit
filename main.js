// --- 1. IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// --- 2. YOUR REAL CONFIG (BAKED IN) ---
const firebaseConfig = {
    apiKey: "AIzaSyB-fZTbZqNOJyPZhtnT8v0EiRb5XhCFzP0",
    authDomain: "gem-edit.firebaseapp.com",
    projectId: "gem-edit",
    storageBucket: "gem-edit.firebasestorage.app",
    messagingSenderId: "586824444534",
    appId: "1:586824444534:web:4fe781be673c7edcfb8d57",
    measurementId: "G-BTCENT5HEK"
};

// --- 3. INIT ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// --- 4. STATE ---
let currentUser = null;
let currentProjectId = null;
let selectedElement = null;
let layers = []; // Track layers for the timeline

// --- 5. AUTH & ROUTING ---
const els = {
    auth: document.getElementById('auth-screen'),
    dash: document.getElementById('dashboard'),
    editor: document.getElementById('editor'),
    loginBtn: document.getElementById('google-login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    dashUser: document.getElementById('dash-user-name'),
    projectsList: document.getElementById('projects-list'),
    newProjectBtn: document.getElementById('new-project-btn'),
    backToDashBtn: document.getElementById('back-to-dash-btn'),
    projectTitle: document.getElementById('project-title-input'),
    canvas: document.getElementById('canvas-stage')
};

// Login/Logout
els.loginBtn.addEventListener('click', () => signInWithPopup(auth, provider));
els.logoutBtn.addEventListener('click', () => signOut(auth).then(() => location.reload()));

// Auth Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        els.auth.classList.add('hidden');
        els.dash.classList.remove('hidden');
        els.dashUser.textContent = user.displayName;
        loadProjects();
    } else {
        els.auth.classList.remove('hidden');
        els.dash.classList.add('hidden');
        els.editor.classList.add('hidden');
    }
});

// --- 6. PROJECT MANAGEMENT ---
async function loadProjects() {
    els.projectsList.innerHTML = ''; // Clear old/fake demos
    const q = await getDocs(collection(db, `users/${currentUser.uid}/projects`));
    
    q.forEach(docSnap => {
        const data = docSnap.data();
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <h3>${data.name}</h3>
            <span style="font-size:0.7rem; color:#666">Edited: Today</span>
            <div class="delete-proj" data-id="${docSnap.id}">✕</div>
        `;
        
        // Open Project
        card.addEventListener('click', (e) => {
            if(!e.target.classList.contains('delete-proj')) openProject(docSnap.id, data);
        });

        // Delete Project
        card.querySelector('.delete-proj').addEventListener('click', async (e) => {
            e.stopPropagation();
            if(confirm("Delete this project?")) {
                await deleteDoc(doc(db, `users/${currentUser.uid}/projects`, docSnap.id));
                loadProjects();
            }
        });

        els.projectsList.appendChild(card);
    });
}

els.newProjectBtn.addEventListener('click', async () => {
    const docRef = await addDoc(collection(db, `users/${currentUser.uid}/projects`), {
        name: "Untitled Project",
        createdAt: new Date().toISOString()
    });
    openProject(docRef.id, { name: "Untitled Project" });
});

function openProject(id, data) {
    currentProjectId = id;
    els.projectTitle.value = data.name;
    els.dash.classList.add('hidden');
    els.editor.classList.remove('hidden');
    els.canvas.innerHTML = ''; 
    document.getElementById('timeline-tracks').innerHTML = ''; // Clear timeline
    layers = [];
    
    // Reset to 16:9 Default
    updateRatio('16/9');
}

// Rename Project
els.projectTitle.addEventListener('change', async (e) => {
    if(currentProjectId) {
        await updateDoc(doc(db, `users/${currentUser.uid}/projects`, currentProjectId), {
            name: e.target.value
        });
    }
});

els.backToDashBtn.addEventListener('click', () => {
    els.editor.classList.add('hidden');
    els.dash.classList.remove('hidden');
    loadProjects();
});

// --- 7. ASPECT RATIO ENGINE (CapCut Style) ---
document.querySelectorAll('.ratio-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateRatio(btn.dataset.ratio);
    });
});

function updateRatio(ratio) {
    const stage = els.canvas;
    // Base height 500px, calculate width based on ratio
    if(ratio === '16/9') { stage.style.width = '888px'; stage.style.height = '500px'; }
    if(ratio === '9/16') { stage.style.width = '281px'; stage.style.height = '500px'; }
    if(ratio === '1/1') { stage.style.width = '500px'; stage.style.height = '500px'; }
}

// --- 8. LAYER & TIMELINE SYSTEM ---
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-upload');

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(f => {
        const url = URL.createObjectURL(f);
        createLayer(url, f.type.includes('video') ? 'video' : 'image', f.name);
    });
});

function createLayer(url, type, name) {
    const id = 'layer-' + Date.now();
    
    // 1. Create Canvas Element
    const el = document.createElement('div');
    el.className = 'layer-element';
    el.id = id;
    el.style.width = '300px'; el.style.top = '50px'; el.style.left = '50px';
    
    const content = document.createElement(type === 'video' ? 'video' : 'img');
    content.src = url;
    content.style.width = '100%'; content.style.height = '100%'; content.style.objectFit = 'cover';
    if(type === 'video') { content.loop = true; content.muted = true; content.play(); }
    
    el.appendChild(content);
    els.canvas.appendChild(el);
    makeDraggable(el);

    // 2. Create Timeline Track Bar
    const track = document.createElement('div');
    track.className = 'track-bar';
    track.id = 'track-' + id;
    track.innerHTML = `<span class="iconify" data-icon="ph:${type === 'video' ? 'film-strip' : 'image'}"></span> ${name}`;
    
    // Click Track to Select Layer
    track.addEventListener('click', () => selectLayer(el, track));
    el.addEventListener('mousedown', (e) => { e.stopPropagation(); selectLayer(el, track); });

    document.getElementById('timeline-tracks').appendChild(track);
    
    layers.push({ id, el, track });
    selectLayer(el, track);
}

// --- 9. SELECTION & PROPERTIES ---
function selectLayer(el, track) {
    selectedElement = el;
    
    // Highlight Canvas Element
    document.querySelectorAll('.layer-element').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    
    // Highlight Timeline Track
    document.querySelectorAll('.track-bar').forEach(t => t.classList.remove('selected'));
    track.classList.add('selected');

    // Load Properties
    const panel = document.getElementById('prop-panel-content');
    const template = document.getElementById('layer-props-template');
    panel.innerHTML = '';
    panel.appendChild(template.content.cloneNode(true));
    
    const content = el.querySelector('img, video');

    // Bind Controls
    panel.querySelectorAll('.prop-slider').forEach(slider => {
        const prop = slider.dataset.prop;
        const filter = slider.dataset.filter;
        
        // Init Values
        if(prop === 'opacity') slider.value = (el.style.opacity || 1) * 100;
        if(prop === 'scale') slider.value = el.dataset.scale || 1;

        slider.addEventListener('input', (e) => {
            const val = e.target.value;
            if(e.target.previousElementSibling) 
                e.target.previousElementSibling.querySelector('.val-display').innerText = val + (filter ? '' : '%');
            
            if(prop === 'opacity') el.style.opacity = val / 100;
            if(prop === 'scale') {
                el.dataset.scale = val;
                el.style.transform = `scale(${val})`;
            }
            if(filter) {
                // Simplified single filter for demo, real stacking requires state management
                content.style.filter = `${filter}(${val}${filter === 'hue-rotate' ? 'deg' : filter === 'blur' ? 'px' : '%'})`;
            }
        });
    });

    // Delete
    panel.querySelector('[data-action="delete"]').addEventListener('click', () => {
        el.remove();
        track.remove();
        panel.innerHTML = '<p class="empty-state">Select a layer</p>';
    });
}

// --- 10. PHYSICS ---
function makeDraggable(element) {
    let isDragging = false; let startX, startY, initialLeft, initialTop;
    element.addEventListener('mousedown', (e) => {
        isDragging = true; startX = e.clientX; startY = e.clientY;
        initialLeft = element.offsetLeft; initialTop = element.offsetTop;
        element.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        element.style.left = `${initialLeft + (e.clientX - startX)}px`;
        element.style.top = `${initialTop + (e.clientY - startY)}px`;
    });
    window.addEventListener('mouseup', () => { isDragging = false; element.style.cursor = 'grab'; });
}

// --- 11. TRANSPORT ---
const scrubber = document.getElementById('scrubber');
const timeDisplay = document.getElementById('time-display');
let isPlaying = false; let playInterval;

document.getElementById('play-btn').addEventListener('click', () => {
    if(isPlaying) return; isPlaying = true;
    playInterval = setInterval(() => {
        let val = parseInt(scrubber.value) + 1;
        if(val > 100) val = 0;
        scrubber.value = val;
        updateTime(val);
    }, 100);
});
document.getElementById('stop-btn').addEventListener('click', () => { isPlaying = false; clearInterval(playInterval); });
scrubber.addEventListener('input', (e) => updateTime(e.target.value));

function updateTime(val) {
    const secs = Math.floor((val / 100) * 60);
    const m = Math.floor(secs / 60); const s = secs % 60;
    timeDisplay.textContent = `00:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
}
