const SIZE = 4;
let board, score, best;

function initGame() {
  board = Array.from({length: SIZE}, () => Array(SIZE).fill(0));
  score = 0;
  best = parseInt(localStorage.getItem('2048best') || '0');
  hideOverlay();
  addRandom();
  addRandom();
  render();
}

function addRandom() {
  const empty = [];
  board.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r, c]); }));
  if (!empty.length) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.85 ? 2 : 4;
  return [r, c];
}

function render(newCell) {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  board.forEach((row, r) => {
    row.forEach((val, c) => {
      const cell = document.createElement('div');
      cell.className = 'cell' + (val ? ` t${val}` : '');
      if (val) cell.textContent = val;
      if (newCell && newCell[0] === r && newCell[1] === c) cell.classList.add('pop');
      grid.appendChild(cell);
    });
  });
  document.getElementById('score').textContent = score;
  if (score > best) {
    best = score;
    localStorage.setItem('2048best', best);
  }
  document.getElementById('best').textContent = best;
}

function slide(row) {
  let arr = row.filter(v => v);
  let gained = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      gained += arr[i];
      arr.splice(i + 1, 1);
    }
  }
  while (arr.length < SIZE) arr.push(0);
  return { arr, gained };
}

function move(dir) {
  let changed = false;
  let scoreGain = 0;
  const rotations = { left: 0, right: 2, up: 1, down: 3 };
  let b = rotateBoard(board, rotations[dir]);
  b = b.map(row => {
    const { arr, gained } = slide(row);
    if (arr.join() !== row.join()) changed = true;
    scoreGain += gained;
    return arr;
  });
  board = rotateBoard(b, (4 - rotations[dir]) % 4);
  if (!changed) return;
  score += scoreGain;
  const newCell = addRandom();
  render(newCell);
  setTimeout(() => {
    document.querySelectorAll('.cell:not(.t0)').forEach(c => {
      if (scoreGain > 0) c.classList.add('merge-flash');
      setTimeout(() => c.classList.remove('merge-flash'), 300);
    });
  }, 50);
  if (isWon()) showOverlay('You Won! 🎉', 'Reached 2048!');
  else if (isGameOver()) showOverlay('Game Over!', 'No moves left');
}

function rotateBoard(b, times) {
  let r = b.map(row => [...row]);
  for (let t = 0; t < times; t++) {
    r = r[0].map((_, i) => r.map(row => row[i]).reverse());
  }
  return r;
}

function isWon() {
  return board.some(row => row.some(v => v === 2048));
}

function isGameOver() {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (!board[r][c]) return false;
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return false;
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return false;
    }
  return true;
}

function showOverlay(title, sub) {
  document.getElementById('overlay-title').textContent = title;
  document.getElementById('overlay-sub').textContent = sub;
  document.getElementById('overlay').classList.add('show');
}

function hideOverlay() {
  document.getElementById('overlay').classList.remove('show');
}

// Keyboard controls
const keyMap = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  a: 'left', d: 'right', w: 'up', s: 'down',
  A: 'left', D: 'right', W: 'up', S: 'down'
};
document.addEventListener('keydown', e => {
  if (keyMap[e.key]) { e.preventDefault(); move(keyMap[e.key]); }
});

// Touch / Swipe controls
let tx, ty;
document.addEventListener('touchstart', e => {
  tx = e.touches[0].clientX;
  ty = e.touches[0].clientY;
}, { passive: true });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
  else move(dy > 0 ? 'down' : 'up');
}, { passive: true });

initGame();
