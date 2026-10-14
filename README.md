# 🎮 Neon Tic-Tac-Toe Web Game

A modern, fast, and responsive Tic-Tac-Toe web application built with vanilla HTML5, CSS3, and modern JavaScript.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-yellow.svg)

---

## ✨ Features

- **3 Game Modes**:
  - 👥 **2 Players (Pass & Play)**: Play locally on the same screen with a friend.
  - 🤖 **vs AI (Easy)**: Random selection, great for quick casual rounds.
  - ⚡ **vs AI (Smart)**: Powered by the **Minimax Algorithm** (unbeatable challenge!).
- **Neon Dark Glassmorphism Design**: Glow effects, vibrant cyan/pink palette, and smooth micro-animations.
- **Dynamic Audio System**: Built-in sound synthesis via the **Web Audio API** (zero external MP3/WAV files required).
- **Celebration Confetti**: Physics-based confetti particles on victory.
- **Animated Strike Line**: SVG line dynamically drawn across the 3 winning cells.
- **Persistent Scoreboard**: Saves wins and ties to browser `localStorage`.
- **Fully Responsive**: Optimized for both smartphones and desktop browsers.

---

## 🚀 How to Run Locally

Because this game is built with vanilla web technologies, you don't need `npm` or build tools:

1. Locate the project folder:
   ```
   C:\Users\comp\.gemini\antigravity-ide\scratch\tic-tac-toe
   ```
2. Double-click **`index.html`** to open it directly in your favorite browser (Chrome, Edge, Firefox, Safari).

---

## 🐙 How to Push to Git & GitHub

Follow these simple steps in your terminal (PowerShell or Bash) to push your game to GitHub and make it playable live online:

### Step 1: Initialize Git and Commit
```bash
# Navigate to the project directory
cd C:\Users\comp\.gemini\antigravity-ide\scratch\tic-tac-toe

# Initialize Git
git init

# Stage all files
git add .

# Create your first commit
git commit -m "feat: initial release of neon tic-tac-toe game"
```

### Step 2: Create a GitHub Repository
1. Log in to [GitHub](https://github.com/).
2. Click the **`+`** icon in the top-right corner and select **New repository**.
3. Name your repository (e.g., `neon-tic-tac-toe`).
4. Keep it **Public** so you can deploy with GitHub Pages.
5. **Do NOT** check "Add a README file" (we already have one).
6. Click **Create repository**.

### Step 3: Link & Push to GitHub
Copy and paste the following commands (replace `YOUR_USERNAME` with your actual GitHub username):

```bash
# Rename branch to main
git branch -M main

# Link to your remote GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/neon-tic-tac-toe.git

# Push code to GitHub
git push -u origin main
```

---

## 🌐 Publish Live for Free (GitHub Pages)

You can share a link with anyone to play your game directly in their browser:

1. On your GitHub repository page, click **Settings** (gear icon).
2. On the left sidebar, click **Pages**.
3. Under **Branch**, select `main` and `/ (root)`.
4. Click **Save**.
5. Within 1–2 minutes, your game will be live at:
   ```
   https://YOUR_USERNAME.github.io/neon-tic-tac-toe/
   ```

---

## 🧠 Code Architecture Explained

- [index.html](file:///C:/Users/comp/.gemini/antigravity-ide/scratch/tic-tac-toe/index.html): Defines the 3×3 grid structure, scoreboards, turn status, and controls.
- [style.css](file:///C:/Users/comp/.gemini/antigravity-ide/scratch/tic-tac-toe/style.css): Defines color variables, CSS Grid layout, neon glow drop-shadows, and responsive media queries.
- [script.js](file:///C:/Users/comp/.gemini/antigravity-ide/scratch/tic-tac-toe/script.js):
  - `board`: 9-element array tracking the cells.
  - `checkWin()`: Tests against the 8 winning combinations.
  - `minimax()`: Evaluates every future move to pick the optimal decision for unbeatable AI.
  - `SoundSystem`: Uses oscillator nodes to create custom sound effects without external files.
