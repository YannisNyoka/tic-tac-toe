// React hooks for state, lifecycle effects, and memoized values
import { useEffect, useMemo, useState } from 'react'

// Main application component: manages game state, UI, and AI behavior
function App() {
  // Current board dimension (3×3 or 5×5)
  const [boardSize, setBoardSize] = useState(5)
  // Flat array of cells; each cell is 'X', 'O', or null
  const [board, setBoard] = useState(Array(boardSize * boardSize).fill(null))
  // Number of consecutive marks required to win (3 for 3×3, 4 for 5×5)
  const winLength = boardSize === 3 ? 3 : 4
  // Whose turn it is: true → X, false → O
  const [isXNext, setIsXNext] = useState(true)
  // The winner ('X' or 'O'), or null if no winner yet
  const [winner, setWinner] = useState(null)
  // Whether the current round is a draw (board full with no winner)
  const [isDraw, setIsDraw] = useState(false)
  // Game mode: player vs player ('pvp') or player vs AI ('ai')
  const [mode, setMode] = useState('pvp') // 'pvp' | 'ai'
  // Scoreboard accumulated across rounds
  const [scores, setScores] = useState({ X: 0, O: 0 })

  // Recompute winner and draw status whenever the board changes
  useEffect(() => {
    const w = computeWinner(board, boardSize, winLength)
    setWinner(w)
    // Draw: no winner and no empty cells
    setIsDraw(!w && board.every((c) => c !== null))
  }, [board, boardSize, winLength])

  // When a winner is determined, increment their score
  useEffect(() => {
    if (winner) {
      setScores((prev) => ({ ...prev, [winner]: prev[winner] + 1 }))
    }
  }, [winner])

  // In AI mode, let the computer play as 'O' on its turn
  useEffect(() => {
    if (mode !== 'ai') return
    if (winner || isDraw) return
    if (isXNext) return

    const timer = setTimeout(() => {
      // Choose a smart move for 'O' based on heuristic scoring
      const idx = getSmartAiMove(board, boardSize, winLength)
      if (idx == null) return
      const next = [...board]
      next[idx] = 'O'
      setBoard(next)
      setIsXNext(true)
    }, 350)

    return () => clearTimeout(timer)
  }, [board, isXNext, mode, winner, isDraw, boardSize, winLength])

  // Human-readable status line shown above the board
  const statusMessage = useMemo(() => {
    if (winner) return `Winner: Player ${winner} 🎉`
    if (isDraw) return 'It’s a draw. No moves left.'
    if (mode === 'ai' && !isXNext) return 'AI is thinking…'
    return `Player ${isXNext ? 'X' : 'O'}’s Turn`
  }, [winner, isDraw, isXNext, mode])

  // CSS class reflecting winner/draw/normal state
  const statusClass =
    winner ? 'status status--winner' : isDraw ? 'status status--draw' : 'status'

  // Handle a player's click on a cell (ignore invalid clicks)
  const handleCellClick = (index) => {
    if (winner || isDraw) return
    if (board[index] !== null) return
    if (mode === 'ai' && !isXNext) return

    const next = [...board]
    next[index] = isXNext ? 'X' : 'O'
    setBoard(next)
    setIsXNext((prev) => !prev)
  }

  // Reset the current round while keeping the current board size
  const restartGame = () => {
    setBoard(Array(boardSize * boardSize).fill(null))
    setIsXNext(true)
    setWinner(null)
    setIsDraw(false)
  }

  // Switch between PvP and AI modes; start a fresh round
  const changeMode = (newMode) => {
    setMode(newMode)
    // Reset board while preserving current board size
    setBoard(Array(boardSize * boardSize).fill(null))
    setIsXNext(true)
    setWinner(null)
    setIsDraw(false)
  }

  // Change board dimension and start a fresh round (winLength adjusts automatically)
  const changeBoardSize = (newSize) => {
    setBoardSize(newSize)
    setBoard(Array(newSize * newSize).fill(null))
    setIsXNext(true)
    setWinner(null)
    setIsDraw(false)
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          {/* Title and controls for mode and board size */}
          <h1 className="title">Tic-Tac-Toe</h1>
          <div className="mode">
            <button
              className={`btn ${mode === 'pvp' ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => changeMode('pvp')}
            >
              Player vs Player
            </button>
            <button
              className={`btn ${mode === 'ai' ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => changeMode('ai')}
            >
              Player vs AI
            </button>
          </div>
          <div className="mode">
            <button
              className={`btn ${boardSize === 3 ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => changeBoardSize(3)}
            >
              3×3
            </button>
            <button
              className={`btn ${boardSize === 5 ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => changeBoardSize(5)}
            >
              5×5
            </button>
          </div>
        </header>

        <section className="content">
          <div className="left">
            {/* Status banner and interactive board */}
            <div className={statusClass}>{statusMessage}</div>
            <Board
              board={board}
              onCellClick={handleCellClick}
              disabled={!!winner || isDraw || (mode === 'ai' && !isXNext)}
              size={boardSize}
            />
          </div>

          <aside className="sidebar">
            {/* Scoreboard and helpful information */}
            <div className="scoreboard">
              <h2 className="score-title">Scoreboard</h2>
              <div className="score-item">
                <span className="score-label">Player X</span>
                <span className="score-value">{scores.X}</span>
              </div>
              <div className="score-item">
                <span className="score-label">Player O</span>
                <span className="score-value">{scores.O}</span>
              </div>
            </div>

            <button
              className="btn btn--primary btn--block"
              onClick={restartGame}
            >
              Restart Game
            </button>

            <div className="rules">
              <h2 className="rules-title">Game Rules</h2>
              <ul className="rules-list">
                <li>Players take turns placing marks; Player X goes first.</li>
                <li>3×3 board: get 3 in a row to win.</li>
                <li>5×5 board: get 4 in a row to win.</li>
                <li>Winning lines can be horizontal, vertical, or diagonal.</li>
                <li>Marked cells cannot be changed.</li>
                <li>Draw occurs when the board is full with no winner.</li>
                <li>Player vs AI: you play X; the AI plays O.</li>
                <li>Restart resets the current round; scores persist.</li>
                <li>Changing mode or size resets the current round.</li>
              </ul>
            </div>

            <div className="instructions">
              <h2 className="instructions-title">How to Play</h2>
              <ol className="instructions-list">
                <li>Select a mode: Player vs Player or Player vs AI.</li>
                <li>Choose a board size: 3×3 (win on 3) or 5×5 (win on 4).</li>
                <li>Player X starts. Click an empty cell to place your mark.</li>
                <li>Make a straight line (row, column, or diagonal) to win.</li>
                <li>Use “Restart Game” to start a new round; scores persist.</li>
                <li>In AI mode, the computer (O) plays after your move.</li>
              </ol>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}

// Board component: renders a responsive grid of cells
function Board({ board, onCellClick, disabled, size }) {
  return (
    <div
      className="board"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
    >
      {board.map((value, idx) => (
        <Cell
          key={idx}
          value={value}
          onClick={() => onCellClick(idx)}
          disabled={disabled || value !== null}
        />
      ))}
    </div>
  )
}

// Cell component: an interactive button representing a single board cell
function Cell({ value, onClick, disabled }) {
  const clickable = !disabled && value === null
  const classes = ['cell']
  if (value === 'X') classes.push('cell--x')
  else if (value === 'O') classes.push('cell--o')
  if (clickable) classes.push('cell--hover')

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classes.join(' ')}
      aria-label="board cell"
    >
      {value ?? ''}
    </button>
  )
}

// Winner detection: checks for any line of length `winLength`
// across rows, columns, and both diagonals. Returns 'X', 'O', or null.
function computeWinner(board, size, winLength) {
  // Rows: scan contiguous windows of length winLength
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      const i0 = r * size + c
      const v = board[i0]
      if (v) {
        let ok = true
        for (let k = 1; k < winLength; k++) {
          if (board[i0 + k] !== v) { ok = false; break }
        }
        if (ok) return v
      }
    }
  }

  // Columns: scan vertical windows
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - winLength; r++) {
      const i0 = r * size + c
      const v = board[i0]
      if (v) {
        let ok = true
        for (let k = 1; k < winLength; k++) {
          if (board[i0 + k * size] !== v) { ok = false; break }
        }
        if (ok) return v
      }
    }
  }

  // Diagonal down-right: scan along (r+1, c+1)
  for (let r = 0; r <= size - winLength; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      const i0 = r * size + c
      const v = board[i0]
      if (v) {
        let ok = true
        for (let k = 1; k < winLength; k++) {
          if (board[i0 + k * (size + 1)] !== v) { ok = false; break }
        }
        if (ok) return v
      }
    }
  }

  // Diagonal down-left: scan along (r+1, c-1)
  for (let r = 0; r <= size - winLength; r++) {
    for (let c = winLength - 1; c < size; c++) {
      const i0 = r * size + c
      const v = board[i0]
      if (v) {
        let ok = true
        for (let k = 1; k < winLength; k++) {
          if (board[i0 + k * (size - 1)] !== v) { ok = false; break }
        }
        if (ok) return v
      }
    }
  }

  return null
}

// Smart AI: prefers immediate win, blocks threats, otherwise uses heuristics
function getSmartAiMove(board, size, winLength) {
  // 1) Try winning move
  const winMove = findImmediateMove(board, size, winLength, 'O')
  if (winMove != null) return winMove

  // 2) Block opponent immediate win
  const blockMove = findImmediateMove(board, size, winLength, 'X')
  if (blockMove != null) return blockMove

  // 3) Heuristic scoring across all empty cells
  const empty = []
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) empty.push(i)
  }
  if (empty.length === 0) return null

  // Prefer center slightly
  const centerIndex = getCenterIndex(size)

  let bestIdx = empty[0]
  let bestScore = -Infinity

  for (const idx of empty) {
    const score = evaluateCell(board, size, winLength, idx, centerIndex)
    if (score > bestScore) {
      bestScore = score
      bestIdx = idx
    }
  }
  return bestIdx
}

// Try every empty cell: if placing `player` there wins immediately, choose it
function findImmediateMove(board, size, winLength, player) {
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== null) continue
    const next = [...board]
    next[i] = player
    const w = computeWinner(next, size, winLength)
    if (w === player) return i
  }
  return null
}

// Heuristic evaluation of placing 'O' at `idx`:
// - Rewards building O chains and proximity to center
// - Penalizes strong X chains (defensive play)
function evaluateCell(board, size, winLength, idx, centerIndex) {
  // Place O hypothetically at idx for scoring
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diag down-right
    [1, -1],  // diag down-left
  ]

  let score = 0

  // Slight bias toward center
  if (centerIndex != null) {
    const [cr, cc] = [Math.floor(centerIndex / size), centerIndex % size]
    const [r, c] = [Math.floor(idx / size), idx % size]
    const dist = Math.abs(r - cr) + Math.abs(c - cc)
    score += Math.max(0, 10 - dist) // closer to center -> more points
  }

  // For each direction, scan windows of length winLength that include idx
  for (const [dr, dc] of directions) {
    // Windows where idx is within the window: start offset t from -(winLength-1) to 0
    for (let t = -(winLength - 1); t <= 0; t++) {
      let windowCells = []
      let containsIdx = false
      for (let k = 0; k < winLength; k++) {
        const rr = Math.floor(idx / size) + (t + k) * dr
        const cc = (idx % size) + (t + k) * dc
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) {
          windowCells = null
          break
        }
        const pos = rr * size + cc
        windowCells.push(pos)
        if (pos === idx) containsIdx = true
      }
      if (!windowCells || !containsIdx) continue

      // Count marks in the window (assume O is placed at idx)
      let countO = 0
      let countX = 0
      for (const pos of windowCells) {
        const v = pos === idx ? 'O' : board[pos]
        if (v === 'O') countO++
        else if (v === 'X') countX++
      }

      // If window has X, it's less valuable for O to build; if window has O, it's useful.
      if (countX === 0) {
        // Open window for O to extend
        // Quadratic reward encourages building longer chains
        score += countO * countO * 25
        // Bonus if this window is one move away from a win
        if (countO === winLength - 1) score += 200
      } else {
        // Penalize windows dominated by X (to encourage defensive placement)
        score -= countX * countX * 20
        if (countX === winLength - 1) score -= 150
      }
    }
  }

  // Small corner preference (especially for 3x3)
  const corners = [0, size - 1, size * (size - 1), size * size - 1]
  if (corners.includes(idx)) score += size === 3 ? 15 : 5

  return score
}

// Board center index (used to prefer central positions in heuristics)
function getCenterIndex(size) {
  // For odd sizes, exact center; for even (not used here), nearest center
  const center = Math.floor(size / 2)
  return center * size + center
}

export default App
