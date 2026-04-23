// ============================================================
//  game.js  —  Connect 4 Game Logic & UI Controller
// ============================================================

const ROWS = 6, COLS = 7;

let board      = [];       // 6x7 grid, null | 'red' | 'yellow'
let currentPlayer = 'red'; // 'red' = Player 1, 'yellow' = Player 2 or AI
let gameOver   = false;
let mode       = 'pvp';    // 'pvp' or 'ai'
let scores     = { red: 0, yellow: 0 };
let aiThinking = false;

// ===== INIT =====

function initBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function buildBoardDOM() {
  const boardEl   = document.getElementById('board');
  const hoverRow  = document.getElementById('hover-row');
  boardEl.innerHTML  = '';
  hoverRow.innerHTML = '';

  for (let c = 0; c < COLS; c++) {
    const arrow = document.createElement('div');
    arrow.className = 'hover-arrow';
    arrow.id = `arrow-${c}`;
    arrow.textContent = '▼';
    hoverRow.appendChild(arrow);
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.id = `cell-${r}-${c}`;
      cell.dataset.col = c;
      cell.addEventListener('click',      () => handleClick(c));
      cell.addEventListener('mouseenter', () => handleHover(c, true));
      cell.addEventListener('mouseleave', () => handleHover(c, false));
      boardEl.appendChild(cell);
    }
  }
}

function init() {
  initBoard();
  buildBoardDOM();
  updateTurnUI();
}

// ===== MODE =====

function setMode(newMode) {
  mode = newMode;
  document.getElementById('btn-pvp').classList.toggle('active', mode === 'pvp');
  document.getElementById('btn-ai').classList.toggle('active',  mode === 'ai');
  document.getElementById('label-yellow').textContent = mode === 'ai' ? 'AI' : 'Player 2';
  resetGame();
}

// ===== CLICK HANDLER =====

function handleClick(col) {
  if (gameOver || aiThinking) return;
  if (mode === 'ai' && currentPlayer === 'yellow') return; // AI's turn

  dropPiece(col, currentPlayer);
}

function handleHover(col, entering) {
  if (gameOver || aiThinking) return;
  if (mode === 'ai' && currentPlayer === 'yellow') return;

  for (let c = 0; c < COLS; c++) {
    const arrow = document.getElementById(`arrow-${c}`);
    if (arrow) arrow.classList.toggle('visible', entering && c === col && board[0][col] === null);
  }
}

// ===== DROP PIECE =====

function dropPiece(col, player) {
  if (board[0][col] !== null) return; // column full

  let row = -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === null) { row = r; break; }
  }
  if (row === -1) return;

  board[row][col] = player;
  setCellClass(row, col, player);

  const winCells = getWinCells(player);
  if (winCells) {
    triggerWin(player, winCells);
    return;
  }

  if (isBoardFull()) {
    triggerDraw();
    return;
  }

  currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
  updateTurnUI();

  if (mode === 'ai' && currentPlayer === 'yellow') {
    scheduleAI();
  }
}

// ===== AI =====

function scheduleAI() {
  aiThinking = true;
  showThinking(true);
  setTimeout(() => {
    const col = AI.getBestMove(board);
    aiThinking = false;
    showThinking(false);
    if (col !== null) dropPiece(col, 'yellow');
  }, 300); // small delay so it feels responsive, not instant
}

function showThinking(on) {
  const el = document.getElementById('turn-text');
  if (on) {
    el.innerHTML = 'AI is thinking <span class="thinking-dots"><span></span><span></span><span></span></span>';
  } else {
    updateTurnUI();
  }
}

// ===== WIN DETECTION =====

function getWinCells(piece) {
  // Horizontal
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c <= COLS - 4; c++)
      if ([0,1,2,3].every(i => board[r][c+i] === piece))
        return [[r,c],[r,c+1],[r,c+2],[r,c+3]];

  // Vertical
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r <= ROWS - 4; r++)
      if ([0,1,2,3].every(i => board[r+i][c] === piece))
        return [[r,c],[r+1,c],[r+2,c],[r+3,c]];

  // Diagonal /
  for (let r = 3; r < ROWS; r++)
    for (let c = 0; c <= COLS - 4; c++)
      if ([0,1,2,3].every(i => board[r-i][c+i] === piece))
        return [[r,c],[r-1,c+1],[r-2,c+2],[r-3,c+3]];

  // Diagonal \
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 0; c <= COLS - 4; c++)
      if ([0,1,2,3].every(i => board[r+i][c+i] === piece))
        return [[r,c],[r+1,c+1],[r+2,c+2],[r+3,c+3]];

  return null;
}

function isBoardFull() {
  return board[0].every(c => c !== null);
}

// ===== GAME OVER =====

function triggerWin(player, winCells) {
  gameOver = true;
  scores[player]++;
  updateScoreUI();

  winCells.forEach(([r, c]) => {
    const cell = document.getElementById(`cell-${r}-${c}`);
    if (cell) cell.classList.add('win-piece');
  });

  setTimeout(() => {
    const isAI    = mode === 'ai' && player === 'yellow';
    const name    = getPlayerName(player);
    const subs    = ['Brilliant play 🎉', 'Outstanding! 🏆', 'Well played! ✨', 'Masterful! 🎯'];
    const aiSubs  = ['Better luck next time 🤖', 'The machine wins… 🤖', 'GG! 🤖'];
    const drawSub = 'No winner this time!';

    showModal(
      player,
      `${name} Wins!`,
      isAI ? aiSubs[Math.floor(Math.random() * aiSubs.length)]
           : subs[Math.floor(Math.random() * subs.length)]
    );
  }, 600);

  // Update turn text
  document.getElementById('turn-text').textContent = `${getPlayerName(player)} wins!`;
}

function triggerDraw() {
  gameOver = true;
  setTimeout(() => showModal('draw', "It's a Draw!", "No winner this time 🤝"), 300);
  document.getElementById('turn-text').textContent = "It's a draw!";
}

function showModal(player, title, sub) {
  const modal    = document.getElementById('modal');
  const chip     = document.getElementById('modal-chip');
  const titleEl  = document.getElementById('modal-title');
  const subEl    = document.getElementById('modal-sub');

  chip.className  = `modal-chip ${player}`;
  titleEl.textContent = title;
  subEl.textContent   = sub;
  modal.style.display = 'flex';
}

// ===== RESET =====

function resetGame() {
  gameOver      = false;
  aiThinking    = false;
  currentPlayer = 'red';
  document.getElementById('modal').style.display = 'none';
  initBoard();
  buildBoardDOM();
  updateTurnUI();
}

function resetScores() {
  scores = { red: 0, yellow: 0 };
  updateScoreUI();
  resetGame();
}

// ===== UI HELPERS =====

function setCellClass(row, col, player) {
  const cell = document.getElementById(`cell-${row}-${col}`);
  if (cell) {
    cell.classList.remove('red', 'yellow');
    void cell.offsetWidth; // force reflow for re-animation
    cell.classList.add(player);
  }
}

function updateTurnUI() {
  const chip = document.getElementById('turn-chip');
  const text = document.getElementById('turn-text');
  const name = getPlayerName(currentPlayer);

  chip.style.background  = currentPlayer === 'red' ? 'var(--red)' : 'var(--yellow)';
  chip.style.boxShadow   = currentPlayer === 'red'
    ? '0 0 10px var(--red-glow)'
    : '0 0 10px var(--yellow-glow)';
  text.textContent = `${name}'s turn`;
}

function updateScoreUI() {
  document.getElementById('wins-red').textContent    = scores.red;
  document.getElementById('wins-yellow').textContent = scores.yellow;
}

function getPlayerName(player) {
  if (player === 'red')    return 'Player 1';
  if (player === 'yellow') return mode === 'ai' ? 'AI' : 'Player 2';
  return '';
}

// ===== BOOT =====
init();