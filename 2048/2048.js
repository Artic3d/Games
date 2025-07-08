const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const size = 4;
let tileSize;
let board = [];
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let gameOver = false;

const tileColors = {
  0: "#cdc1b4",
  2: "#eee4da",
  4: "#ede0c8",
  8: "#f2b179",
  16: "#f59563",
  32: "#f67c5f",
  64: "#f65e3b",
  128: "#edcf72",
  256: "#edcc61",
  512: "#edc850",
  1024: "#edc53f",
  2048: "#edc22e"
};

function resizeCanvas() {
  // Maak canvas responsive
  let dimension = Math.min(window.innerWidth, window.innerHeight) * 0.9;
  if (dimension > 600) dimension = 600; // Max grootte op desktop
  canvas.width = dimension;
  canvas.height = dimension;
  tileSize = canvas.width / size;
  draw(); // Teken opnieuw bij resize
}

function initBoard() {
  board = [];
  for (let i = 0; i < size; i++) {
    board[i] = [];
    for (let j = 0; j < size; j++) {
      board[i][j] = 0;
    }
  }
  score = 0;
  gameOver = false;
  addTile();
  addTile();
  draw();
  updateScore();
}

function addTile() {
  let empty = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] === 0) {
        empty.push({ x: i, y: j });
      }
    }
  }
  if (empty.length === 0) return;
  let spot = empty[Math.floor(Math.random() * empty.length)];
  board[spot.x][spot.y] = Math.random() < 0.9 ? 2 : 4;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Teken tegels
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      drawTile(i, j, board[i][j]);
    }
  }

  if (gameOver) {
    ctx.fillStyle = "rgba(238, 228, 218, 0.8)";
    ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 100);
    ctx.fillStyle = "#776e65";
    ctx.font = `${canvas.width / 12}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2);
  }
}

function drawTile(row, col, value) {
  ctx.fillStyle = tileColors[value] || "#3c3a32";
  ctx.fillRect(col * tileSize + 5, row * tileSize + 5, tileSize - 10, tileSize - 10);
  if (value) {
    ctx.fillStyle = value <= 4 ? "#776e65" : "#f9f6f2";
    ctx.font = `bold ${tileSize / 2.5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(value, col * tileSize + tileSize / 2, row * tileSize + tileSize / 2);
  }
}

function move(dir) {
  if (gameOver) return;

  let flipped = false, rotated = false, moved = false;

  if (dir === "up") {
    board = rotateLeft(board);
    rotated = true;
  }
  if (dir === "down") {
    board = rotateRight(board);
    rotated = true;
  }
  if (dir === "right") {
    board = flip(board);
    flipped = true;
  }

  for (let i = 0; i < size; i++) {
    let row = board[i];
    let compacted = slide(row);
    if (JSON.stringify(row) !== JSON.stringify(compacted)) {
      moved = true;
    }
    board[i] = compacted;
  }

  if (flipped) board = flip(board);
  if (rotated && dir === "up") board = rotateRight(board);
  if (rotated && dir === "down") board = rotateLeft(board);

  if (moved) {
    addTile();
    draw();
    updateScore();
    if (isGameOver()) {
      gameOver = true;
      draw();
      checkHighScore();
    }
  }
}

function slide(row) {
  row = row.filter(val => val);
  for (let i = 0; i < row.length - 1; i++) {
    if (row[i] === row[i + 1]) {
      row[i] *= 2;
      row[i + 1] = 0;
      score += row[i];
    }
  }
  row = row.filter(val => val);
  while (row.length < size) row.push(0);
  return row;
}

function rotateLeft(mat) {
  let res = [];
  for (let i = 0; i < size; i++) {
    res[i] = [];
    for (let j = 0; j < size; j++) {
      res[i][j] = mat[j][size - i - 1];
    }
  }
  return res;
}

function rotateRight(mat) {
  let res = [];
  for (let i = 0; i < size; i++) {
    res[i] = [];
    for (let j = 0; j < size; j++) {
      res[i][j] = mat[size - j - 1][i];
    }
  }
  return res;
}

function flip(mat) {
  return mat.map(row => row.reverse());
}

function isGameOver() {
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] === 0) return false;
      if (j < size - 1 && board[i][j] === board[i][j + 1]) return false;
      if (i < size - 1 && board[i][j] === board[i + 1][j]) return false;
    }
  }
  return true;
}

function updateScore() {
  document.getElementById("score").textContent = "Score: " + score;
}

function checkHighScore() {
  if (score > highScore) {
    highScore = score;
    document.getElementById("highScore").textContent = "Highscore: " + highScore;
    localStorage.setItem("highScore", highScore);
  }
}

// Knoppen en swipes
document.getElementById("restartButton").addEventListener("click", initBoard);

window.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") move("up");
  if (e.key === "ArrowDown") move("down");
  if (e.key === "ArrowLeft") move("left");
  if (e.key === "ArrowRight") move("right");
});

// Swipe detectie voor mobiel
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

canvas.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30) move("right");
    else if (dx < -30) move("left");
  } else {
    if (dy > 30) move("down");
    else if (dy < -30) move("up");
  }
});

// Initialiseren
document.getElementById("highScore").textContent = "Highscore: " + highScore;
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
initBoard();
