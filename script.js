/**
 * NEON TIC-TAC-TOE GAME ENGINE
 * 
 * This file manages:
 * 1. Board state & game loop
 * 2. Player turn switching
 * 3. AI logic (Random Easy mode + Minimax Unbeatable mode)
 * 4. Win/Draw detection & winning line drawing
 * 5. Web Audio API sound synthesis (no external MP3 files needed)
 * 6. Confetti particle effects on victory
 * 7. LocalStorage score persistence
 */

// ==========================================
// 1. GAME CONSTANTS & STATE
// ==========================================

const WINNING_COMBINATIONS = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6]
];

// Game State
let board = Array(9).fill("");
let currentPlayer = "X";
let gameActive = true;
let currentMode = "pvp"; // 'pvp', 'ai-easy', 'ai-hard'
let isAiThinking = false;
let soundEnabled = true;

const scores = {
  x: 0,
  o: 0,
  ties: 0
};

// ==========================================
// 2. DOM ELEMENT REFERENCES
// ==========================================
const cells = document.querySelectorAll(".cell");
const statusCard = document.getElementById("status-card");
const turnIndicator = document.getElementById("turn-indicator");
const scoreXEl = document.getElementById("score-x");
const scoreOEl = document.getElementById("score-o");
const scoreTiesEl = document.getElementById("score-ties");
const playerXLabel = document.getElementById("player-x-label");
const playerOLabel = document.getElementById("player-o-label");
const restartBtn = document.getElementById("restart-btn");
const resetScoresBtn = document.getElementById("reset-scores-btn");
const modeButtons = document.querySelectorAll(".mode-btn");
const soundToggleBtn = document.getElementById("sound-toggle-btn");
const soundIcon = document.getElementById("sound-icon");
const strikeLine = document.getElementById("strike-line");
const boardWrapper = document.getElementById("board-wrapper");
const confettiCanvas = document.getElementById("confetti-canvas");

// ==========================================
// 3. SOUND SYNTHESIZER (WEB AUDIO API)
// ==========================================
// Generates clean retro/neon sound effects in the browser without loading audio files
class SoundSystem {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playMoveSound(player) {
    if (!soundEnabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // X gets a high crisp futuristic beep, O gets a warm resonant drop
    const freq = player === "X" ? 540 : 380;
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playWinSound() {
    if (!soundEnabled) return;
    this.init();
    const notes = [440, 554.37, 659.25, 880]; // A Major victory arpeggio
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const startTime = this.ctx.currentTime + index * 0.08;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  playDrawSound() {
    if (!soundEnabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(180, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playClickSound() {
    if (!soundEnabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(700, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
}

const sounds = new SoundSystem();

// ==========================================
// 4. CONFETTI ANIMATION SYSTEM
// ==========================================
class ConfettiEffect {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.animationId = null;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  fire() {
    this.particles = [];
    const colors = ["#00f5d4", "#f72585", "#7209b7", "#facc15", "#4cc9f0"];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: this.canvas.width / 2,
        y: this.canvas.height / 2,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.8) * 16,
        gravity: 0.35,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animate();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.opacity -= 0.012;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();
    }

    this.particles = this.particles.filter((p) => p.opacity > 0);

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

const confetti = new ConfettiEffect(confettiCanvas);

// ==========================================
// 5. CORE GAMEPLAY LOGIC
// ==========================================

// Handle a player or AI clicking a cell
function handleCellClick(event) {
  const clickedCell = event.target;
  const cellIndex = parseInt(clickedCell.getAttribute("data-index"), 10);

  // Ignore if cell is filled, game is over, or AI is currently calculating
  if (board[cellIndex] !== "" || !gameActive || isAiThinking) {
    return;
  }

  makeMove(cellIndex, currentPlayer);

  // If game is active and AI mode is selected, trigger AI response
  if (gameActive && currentMode !== "pvp" && currentPlayer === "O") {
    isAiThinking = true;
    updateStatusMessage("AI is thinking...");

    const aiDelay = Math.random() * 250 + 350; // humanized delay (350ms - 600ms)
    setTimeout(() => {
      aiMove();
      isAiThinking = false;
    }, aiDelay);
  }
}

// Applies a move to the board and checks outcomes
function makeMove(index, player) {
  board[index] = player;
  const cellEl = cells[index];
  cellEl.textContent = player;
  cellEl.classList.add("taken", player.toLowerCase());
  cellEl.setAttribute("aria-label", `Cell ${index + 1} taken by ${player}`);

  sounds.playMoveSound(player);

  const winResult = checkWin(board);
  if (winResult) {
    endGame(false, winResult);
  } else if (isBoardFull(board)) {
    endGame(true);
  } else {
    // Switch turn
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateTurnDisplay();
  }
}

// Checks if someone has won based on board state
function checkWin(currentBoard) {
  for (let combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (
      currentBoard[a] &&
      currentBoard[a] === currentBoard[b] &&
      currentBoard[a] === currentBoard[c]
    ) {
      return { winner: currentBoard[a], combo };
    }
  }
  return null;
}

// Checks if board is full
function isBoardFull(currentBoard) {
  return currentBoard.every((cell) => cell !== "");
}

// Ends the current round
function endGame(isDraw, winResult = null) {
  gameActive = false;

  if (isDraw) {
    scores.ties++;
    scoreTiesEl.textContent = scores.ties;
    updateStatusMessage(`🤝 It's a Draw!`);
    sounds.playDrawSound();
  } else {
    const { winner, combo } = winResult;
    if (winner === "X") {
      scores.x++;
      scoreXEl.textContent = scores.x;
    } else {
      scores.o++;
      scoreOEl.textContent = scores.o;
    }

    highlightWinningCells(combo, winner);
    drawStrikeLine(combo, winner);

    const winnerName = getPlayerName(winner);
    updateStatusMessage(`🎉 ${winnerName} Wins!`);

    sounds.playWinSound();
    confetti.fire();
  }

  saveScoresToStorage();
}

// Highlight the 3 winning cells
function highlightWinningCells(combo, winner) {
  combo.forEach((idx) => {
    cells[idx].classList.add("winning-cell");
  });
}

// Draw animated SVG strike-through line
function drawStrikeLine(combo, winner) {
  const rects = Array.from(cells).map((c) => c.getBoundingClientRect());
  const wrapperRect = boardWrapper.getBoundingClientRect();

  const c1 = rects[combo[0]];
  const c3 = rects[combo[2]];

  const x1 = c1.left + c1.width / 2 - wrapperRect.left;
  const y1 = c1.top + c1.height / 2 - wrapperRect.top;
  const x2 = c3.left + c3.width / 2 - wrapperRect.left;
  const y2 = c3.top + c3.height / 2 - wrapperRect.top;

  strikeLine.setAttribute("x1", x1);
  strikeLine.setAttribute("y1", y1);
  strikeLine.setAttribute("x2", x2);
  strikeLine.setAttribute("y2", y2);
  strikeLine.setAttribute("stroke", winner === "X" ? "var(--color-x)" : "var(--color-o)");
  strikeLine.style.display = "block";
}

function clearStrikeLine() {
  strikeLine.style.display = "none";
}

// Display turn status
function updateTurnDisplay() {
  const playerName = getPlayerName(currentPlayer);
  const markClass = currentPlayer === "X" ? "x-mark" : "o-mark";
  turnIndicator.innerHTML = `${playerName}'s Turn (<span class="player-mark ${markClass}">${currentPlayer}</span>)`;
}

function updateStatusMessage(message) {
  turnIndicator.innerHTML = message;
}

function getPlayerName(player) {
  if (currentMode === "pvp") {
    return player === "X" ? "Player X" : "Player O";
  } else {
    return player === "X" ? "You" : "AI";
  }
}

// ==========================================
// 6. ARTIFICIAL INTELLIGENCE (AI) LOGIC
// ==========================================

function aiMove() {
  if (!gameActive) return;

  let moveIndex;
  if (currentMode === "ai-easy") {
    // Easy mode: pick any random open cell
    moveIndex = getEasyAiMove();
  } else {
    // Hard mode: Minimax algorithm (unbeatable)
    moveIndex = getBestMinimaxMove();
  }

  if (moveIndex !== null && moveIndex !== undefined) {
    makeMove(moveIndex, "O");
  }
}

// Easy mode: returns random empty cell
function getEasyAiMove() {
  const emptyIndices = [];
  board.forEach((cell, idx) => {
    if (cell === "") emptyIndices.push(idx);
  });
  if (emptyIndices.length === 0) return null;
  const rand = Math.floor(Math.random() * emptyIndices.length);
  return emptyIndices[rand];
}

// Hard mode: Minimax algorithm
function getBestMinimaxMove() {
  // Opening book optimization: center or corner fast pick
  const emptyCells = board.map((val, idx) => (val === "" ? idx : null)).filter((v) => v !== null);
  if (emptyCells.length === 8 && board[4] === "") {
    return 4; // Take center
  }

  let bestScore = -Infinity;
  let bestMove = emptyCells[0];

  for (let idx of emptyCells) {
    board[idx] = "O";
    let score = minimax(board, 0, false);
    board[idx] = "";

    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }

  return bestMove;
}

function minimax(newBoard, depth, isMaximizing) {
  const win = checkWin(newBoard);
  if (win) {
    return win.winner === "O" ? 10 - depth : depth - 10;
  }
  if (isBoardFull(newBoard)) {
    return 0; // Tie
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (newBoard[i] === "") {
        newBoard[i] = "O";
        let evaluation = minimax(newBoard, depth + 1, false);
        newBoard[i] = "";
        maxEval = Math.max(maxEval, evaluation);
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < 9; i++) {
      if (newBoard[i] === "") {
        newBoard[i] = "X";
        let evaluation = minimax(newBoard, depth + 1, true);
        newBoard[i] = "";
        minEval = Math.min(minEval, evaluation);
      }
    }
    return minEval;
  }
}

// ==========================================
// 7. GAME CONTROLS & EVENT LISTENERS
// ==========================================

// Restart current match (keeps scores)
function restartGame() {
  sounds.playClickSound();
  board = Array(9).fill("");
  gameActive = true;
  currentPlayer = "X";
  isAiThinking = false;

  cells.forEach((cell, idx) => {
    cell.textContent = "";
    cell.className = "cell";
    cell.setAttribute("aria-label", `Cell ${idx + 1}`);
  });

  clearStrikeLine();
  updateTurnDisplay();
}

// Reset score tallies
function resetScores() {
  sounds.playClickSound();
  scores.x = 0;
  scores.o = 0;
  scores.ties = 0;
  scoreXEl.textContent = "0";
  scoreOEl.textContent = "0";
  scoreTiesEl.textContent = "0";
  saveScoresToStorage();
  restartGame();
}

// Switch game mode
function setGameMode(mode) {
  sounds.playClickSound();
  currentMode = mode;

  modeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  // Update labels
  if (mode === "pvp") {
    playerXLabel.textContent = "Player X";
    playerOLabel.textContent = "Player O";
  } else {
    playerXLabel.textContent = "You (X)";
    playerOLabel.textContent = "AI (O)";
  }

  restartGame();
}

// Toggle Sound Mute
function toggleSound() {
  soundEnabled = !soundEnabled;
  soundIcon.textContent = soundEnabled ? "🔊" : "🔇";
  if (soundEnabled) sounds.playClickSound();
}

// LocalStorage helpers
function saveScoresToStorage() {
  try {
    localStorage.setItem("neon_tictactoe_scores", JSON.stringify(scores));
  } catch (e) {
    // Ignore storage issues in restricted iframes
  }
}

function loadScoresFromStorage() {
  try {
    const saved = localStorage.getItem("neon_tictactoe_scores");
    if (saved) {
      const parsed = JSON.parse(saved);
      scores.x = parsed.x || 0;
      scores.o = parsed.o || 0;
      scores.ties = parsed.ties || 0;

      scoreXEl.textContent = scores.x;
      scoreOEl.textContent = scores.o;
      scoreTiesEl.textContent = scores.ties;
    }
  } catch (e) {
    // Ignore storage issues
  }
}

// Setup Event Listeners
function initEventListeners() {
  cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
  restartBtn.addEventListener("click", restartGame);
  resetScoresBtn.addEventListener("click", resetScores);
  soundToggleBtn.addEventListener("click", toggleSound);

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => setGameMode(btn.dataset.mode));
  });

  window.addEventListener("resize", () => {
    const winResult = checkWin(board);
    if (!gameActive && winResult) {
      drawStrikeLine(winResult.combo, winResult.winner);
    }
  });
}

// Boot game
loadScoresFromStorage();
initEventListeners();
updateTurnDisplay();
