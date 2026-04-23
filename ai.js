// ============================================================
//  ai.js  —  Minimax AI with Alpha-Beta Pruning for Connect 4
// ============================================================

const AI = (() => {
  const ROWS = 6, COLS = 7;
  const DEPTH = 6; // search depth (increase for harder AI, may slow down)

  // Score a window of 4 cells for a given player
  function scoreWindow(window, piece) {
    const opp = piece === 'yellow' ? 'red' : 'yellow';
    let score = 0;
    const pieceCount = window.filter(c => c === piece).length;
    const emptyCount = window.filter(c => c === null).length;
    const oppCount   = window.filter(c => c === opp).length;

    if (pieceCount === 4)      score += 100;
    else if (pieceCount === 3 && emptyCount === 1) score += 5;
    else if (pieceCount === 2 && emptyCount === 2) score += 2;
    if (oppCount === 3 && emptyCount === 1) score -= 4;

    return score;
  }

  function scoreBoard(board, piece) {
    let score = 0;

    // Center column preference
    const centerCol = Math.floor(COLS / 2);
    let centerCount = 0;
    for (let r = 0; r < ROWS; r++) {
      if (board[r][centerCol] === piece) centerCount++;
    }
    score += centerCount * 3;

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const window = [board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]];
        score += scoreWindow(window, piece);
      }
    }

    // Vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        const window = [board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]];
        score += scoreWindow(window, piece);
      }
    }

    // Diagonal /
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const window = [board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]];
        score += scoreWindow(window, piece);
      }
    }

    // Diagonal \
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const window = [board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]];
        score += scoreWindow(window, piece);
      }
    }

    return score;
  }

  function checkWin(board, piece) {
    // Horizontal
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c <= COLS - 4; c++)
        if ([0,1,2,3].every(i => board[r][c+i] === piece)) return true;
    // Vertical
    for (let c = 0; c < COLS; c++)
      for (let r = 0; r <= ROWS - 4; r++)
        if ([0,1,2,3].every(i => board[r+i][c] === piece)) return true;
    // Diagonal /
    for (let r = 3; r < ROWS; r++)
      for (let c = 0; c <= COLS - 4; c++)
        if ([0,1,2,3].every(i => board[r-i][c+i] === piece)) return true;
    // Diagonal \
    for (let r = 0; r <= ROWS - 4; r++)
      for (let c = 0; c <= COLS - 4; c++)
        if ([0,1,2,3].every(i => board[r+i][c+i] === piece)) return true;
    return false;
  }

  function getValidCols(board) {
    return Array.from({length: COLS}, (_, c) => c).filter(c => board[0][c] === null);
  }

  function isBoardFull(board) {
    return board[0].every(c => c !== null);
  }

  function isTerminal(board) {
    return checkWin(board, 'red') || checkWin(board, 'yellow') || isBoardFull(board);
  }

  function dropPiece(board, col, piece) {
    const newBoard = board.map(row => [...row]);
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r][col] === null) { newBoard[r][col] = piece; break; }
    }
    return newBoard;
  }

  // Column ordering: prefer center columns for better pruning
  function orderedCols(validCols) {
    const center = Math.floor(COLS / 2);
    return [...validCols].sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
  }

  function minimax(board, depth, alpha, beta, maximizing) {
    const validCols = getValidCols(board);

    if (depth === 0 || isTerminal(board)) {
      if (isTerminal(board)) {
        if (checkWin(board, 'yellow')) return { score: 100000 + depth };
        if (checkWin(board, 'red'))    return { score: -100000 - depth };
        return { score: 0 }; // draw
      }
      return { score: scoreBoard(board, 'yellow') - scoreBoard(board, 'red') };
    }

    if (maximizing) {
      let best = { col: null, score: -Infinity };
      for (const col of orderedCols(validCols)) {
        const newBoard = dropPiece(board, col, 'yellow');
        const result = minimax(newBoard, depth - 1, alpha, beta, false);
        if (result.score > best.score) best = { col, score: result.score };
        alpha = Math.max(alpha, best.score);
        if (alpha >= beta) break; // prune
      }
      return best;
    } else {
      let best = { col: null, score: Infinity };
      for (const col of orderedCols(validCols)) {
        const newBoard = dropPiece(board, col, 'red');
        const result = minimax(newBoard, depth - 1, alpha, beta, true);
        if (result.score < best.score) best = { col, score: result.score };
        beta = Math.min(beta, best.score);
        if (alpha >= beta) break; // prune
      }
      return best;
    }
  }

  // Public: returns the best column for the AI (yellow)
  function getBestMove(board) {
    const result = minimax(board, DEPTH, -Infinity, Infinity, true);
    return result.col;
  }

  return { getBestMove };
})();