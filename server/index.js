import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// In-memory scoreboard (optional use)
const scoreboard = { X: 0, O: 0 }

app.post('/api/winner', (req, res) => {
  const { board, size, winLength } = req.body || {}
  if (!Array.isArray(board) || !size || !winLength) {
    return res.status(400).json({ error: 'Invalid payload' })
  }
  const winner = computeWinner(board, size, winLength)
  const isDraw = !winner && board.every((c) => c !== null)
  res.json({ winner, isDraw })
})

app.post('/api/ai/move', (req, res) => {
  const { board, size, winLength } = req.body || {}
  if (!Array.isArray(board) || !size || !winLength) {
    return res.status(400).json({ error: 'Invalid payload' })
  }
  const idx = getSmartAiMove(board, size, winLength)
  res.json({ index: idx })
})

app.get('/api/score', (_req, res) => {
  res.json({ ...scoreboard })
})

app.post('/api/score/increment', (req, res) => {
  const { winner } = req.body || {}
  if (winner !== 'X' && winner !== 'O') {
    return res.status(400).json({ error: 'Invalid winner' })
  }
  scoreboard[winner] += 1
  res.json({ ...scoreboard })
})

app.post('/api/score/reset', (_req, res) => {
  scoreboard.X = 0
  scoreboard.O = 0
  res.json({ ...scoreboard })
})

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})

// --- Game logic ---
function computeWinner(board, size, winLength) {
  // Rows
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
  // Columns
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
  // Diagonal down-right
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
  // Diagonal down-left
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

function getSmartAiMove(board, size, winLength) {
  const winMove = findImmediateMove(board, size, winLength, 'O')
  if (winMove != null) return winMove
  const blockMove = findImmediateMove(board, size, winLength, 'X')
  if (blockMove != null) return blockMove

  const empty = []
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) empty.push(i)
  }
  if (empty.length === 0) return null

  const centerIndex = getCenterIndex(size)
  let bestIdx = empty[0]
  let bestScore = -Infinity
  for (const idx of empty) {
    const score = evaluateCell(board, size, winLength, idx, centerIndex)
    if (score > bestScore) { bestScore = score; bestIdx = idx }
  }
  return bestIdx
}

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

function evaluateCell(board, size, winLength, idx, centerIndex) {
  const directions = [ [0,1], [1,0], [1,1], [1,-1] ]
  let score = 0

  if (centerIndex != null) {
    const [cr, cc] = [Math.floor(centerIndex / size), centerIndex % size]
    const [r, c] = [Math.floor(idx / size), idx % size]
    const dist = Math.abs(r - cr) + Math.abs(c - cc)
    score += Math.max(0, 10 - dist)
  }

  for (const [dr, dc] of directions) {
    for (let t = -(winLength - 1); t <= 0; t++) {
      let windowCells = []
      let containsIdx = false
      for (let k = 0; k < winLength; k++) {
        const rr = Math.floor(idx / size) + (t + k) * dr
        const cc = (idx % size) + (t + k) * dc
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) { windowCells = null; break }
        const pos = rr * size + cc
        windowCells.push(pos)
        if (pos === idx) containsIdx = true
      }
      if (!windowCells || !containsIdx) continue

      let countO = 0, countX = 0
      for (const pos of windowCells) {
        const v = pos === idx ? 'O' : board[pos]
        if (v === 'O') countO++
        else if (v === 'X') countX++
      }

      if (countX === 0) {
        score += countO * countO * 25
        if (countO === winLength - 1) score += 200
      } else {
        score -= countX * countX * 20
        if (countX === winLength - 1) score -= 150
      }
    }
  }

  const corners = [0, size - 1, size * (size - 1), size * size - 1]
  if (corners.includes(idx)) score += size === 3 ? 15 : 5
  return score
}

function getCenterIndex(size) {
  const center = Math.floor(size / 2)
  return center * size + center
}

