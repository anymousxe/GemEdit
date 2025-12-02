# Matter // Visual Synthesis Engine

![Status](https://img.shields.io/badge/Status-Beta-blueviolet)
![Platform](https://img.shields.io/badge/Platform-Web-blue)
![Stack](https://img.shields.io/badge/Backend-Firebase-orange)

**Matter** is a browser-based non-linear editing (NLE) system designed for rapid visual synthesis. It allows users to import media, manipulate assets in a 2.5D space, and inject custom JavaScript code for procedural animation effects.

The project leverages a serverless architecture, utilizing **Firebase** for authentication and data persistence, and **Vercel** for edge deployment.

---

## 🚀 Deployment

| Live Demo | Source Code |
|-----------|-------------|
| [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com) | [View Repository](./) |

---

## 📂 Architecture & File Structure

This project uses a modular vanilla JavaScript architecture to maintain high performance without heavy framework overhead.

### [📄 index.html](./index.html)
**The Core Application Shell.**
* Contains the DOM structure for the three main states: **Authentication**, **Dashboard**, and **Editor**.
* Loads external dependencies (Iconify, Fonts) and the ES Module entry point.
* **Key Sections:** `auth-screen` (Login), `dashboard` (Project Management), `editor` (Viewport & Tools).

### [🎨 style.css](./style.css)
**Visual Design System.**
* Implements a custom CSS variable system for the dark-mode aesthetic (`--bg`, `--panel`, `--accent`).
* Handles complex UI layouts using CSS Grid and Flexbox.
* Includes 2.5D transformation animations for the login screen and glassmorphism effects on panels.

### [🧠 main.js](./main.js)
**Application Logic & Controller.**
* **Firebase Integration:** Handles Google Auth (`signInWithPopup`) and Firestore CRUD operations (Create, Read, Update, Delete projects).
* **Engine Logic:** Manages the canvas viewport, drag-and-drop physics, and layer selection.
* **Code Injection:** Contains the sandbox logic allowing users to execute raw JavaScript on selected layers for custom effects.

---

## ⚡ Key Features

* **Cloud Persistence:** Projects are saved automatically to a Firestore database linked to the user's Google Account.
* **Asset Management:** Supports local file uploads and integrates with stock media APIs (simulated Pixabay integration).
* **Procedural Effects:** Users can write custom expressions (e.g., `el.style.filter = 'blur(10px)'`) to manipulate layers programmatically.
* **Reactive UI:** The interface updates in real-time based on authentication state and project selection.

---

## 🛠️ Local Development Setup

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/your-username/matter.git](https://github.com/your-username/matter.git)
    ```

2.  **Configure Firebase:**
    * Create a project at [console.firebase.google.com](https://console.firebase.google.com).
    * Enable **Authentication** (Google Provider).
    * Enable **Firestore Database** (Test Mode).
    * Copy your web app configuration keys.

3.  **Update Configuration:**
    * Open `main.js`.
    * Replace the `firebaseConfig` object with your specific API keys.

4.  **Launch:**
    * Open `index.html` in a modern browser (Chrome/Edge/Firefox).
    * *Note: For ES Modules to work locally, you may need to use a local server extension (like Live Server in VS Code).*

---

© 2025 Matter Project. All rights reserved.
