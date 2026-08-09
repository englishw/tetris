const canvas = document.createElement('canvas');
canvas.width = 320;
canvas.height = 640;
const ctx = canvas.getContext('2d')!;
document.getElementById('game-container')!.appendChild(canvas);

const grid = {
    rows: 20,
    cols: 10,
    size: 20
};

type BoardCell = {
    color?: string;
    filled: boolean;
};

const board: BoardCell[][] = Array.from(
    { length: grid.rows },
    () => Array.from({ length: grid.cols }, () => ({ filled: false }))
);

/*  Replacing drawGrid() with palette and drawPlayfield()
function drawGrid() {
    for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
            ctx.strokeStyle = '#ddd';
            ctx.strokeRect(col * grid.size, row * grid.size, grid.size, grid.size);
        }
    }
}
*/

const palette = {
  page: '#090817',
  cabinet: '#171339',
  playfield: '#211d59',
  playfieldEdge: '#655786',
  shadow: '#100d35',
  emptySpeck: '#302a75'
};

function drawPlayfield() {
  const width = grid.cols * grid.size;
  const height = grid.rows * grid.size;

  // Main dark-purple well: no cell outlines or overlapping bezel.
  ctx.fillStyle = palette.playfield;
  ctx.fillRect(0, 0, width, height);

  // A few subtle background pixels add visual depth without becoming a grid.
  ctx.fillStyle = palette.emptySpeck;
  for (const [x, y] of [[2, 2], [5, 5], [8, 8], [3, 13], [7, 17]]) {
    ctx.fillRect(x * grid.size + 8, y * grid.size + 9, 3, 3);
  }
}

function shadeColor(hex: string, amount: number): string {
  const value = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (value >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (value & 0xff) + amount));

  return `rgb(${r}, ${g}, ${b})`;
}

function drawBlock(col: number, row: number, color: string) {
  const x = col * grid.size;
  const y = row * grid.size;
  const gap = 1;
  const size = grid.size - gap * 2;

  // Dark pixel outline / separation between occupied blocks.
  ctx.fillStyle = shadeColor(color, -90);
  ctx.fillRect(x + gap, y + gap, size, size);

  // Main colored square.
  ctx.fillStyle = color;
  ctx.fillRect(x + 3, y + 3, grid.size - 6, grid.size - 6);

  // Bright upper-left highlight.
  ctx.fillStyle = shadeColor(color, 55);
  ctx.fillRect(x + 4, y + 4, grid.size - 8, 3);
  ctx.fillRect(x + 4, y + 4, 3, grid.size - 8);

  // Dark lower-right edge for the chunky, tiled look.
  ctx.fillStyle = shadeColor(color, -45);
  ctx.fillRect(x + 4, y + grid.size - 7, grid.size - 8, 3);
  ctx.fillRect(x + grid.size - 7, y + 4, 3, grid.size - 8);

  // Small inner texture square.
  ctx.fillStyle = shadeColor(color, 25);
  ctx.fillRect(x + 8, y + 8, 4, 4);
}

const tetrominoes: { [key: string]: { shape: number[][], color: string } } = {
    'I': {
        shape: [
            [1, 1, 1, 1]
        ],
        color: '#00FFFF' // Light blue
    },
    'O': {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#FFFF00' // Yellow
    },
    'T': {
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ],
        color: '#8A2BE2' // Purple
    },
    'S': {
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        color: '#7FFF00' // Green
    },
    'Z': {
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        color: '#FF0000' // Red
    },
    'J': {
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ],
        color: '#0000FF' // Dark blue
    },
    'L': {
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ],
        color: '#FFA500' // Orange
    }
};

class Tetromino {
    private shape: number[][];
    private x: number;
    private y: number;
    private color: string;

    constructor(shape: { shape: number[][], color: string }) {
        this.shape = shape.shape;
        this.color = shape.color;
        // Start above the visible area
        this.x = Math.floor((grid.cols / 2) - (shape.shape[0].length / 2));
        this.y = 0; // Adjusted to start above the grid
    }

    /*   Replaced for better visual style
    draw() {
        ctx.fillStyle = this.color;
        for (let i = 0; i < this.shape.length; i++) {
            for (let j = 0; j < this.shape[i].length; j++) {
                if (this.shape[i][j]) {
                    ctx.fillRect((this.x + j) * grid.size, (this.y + i) * grid.size, grid.size, grid.size);
                }
            }
        }
    }
        */

    draw() {
      for (let i = 0; i < this.shape.length; i++) {
        for (let j = 0; j < this.shape[i].length; j++) {
            if (this.shape[i][j]) {
            drawBlock(this.x + j, this.y + i, this.color);
        }
        }
    }
}

    moveDown() {
        this.y++;
    }

    moveLeft() {
        this.x--;
    }

    moveRight() {
        this.x++;
    }

    rotateShape(shape: number[][]): number[][] {
        const newShape: number[][] = [];
        for (let i = 0; i < shape[0].length; i++) {
            const newRow: number[] = [];
            for (let j = shape.length - 1; j >= 0; j--) {
                newRow.push(shape[j][i]);
            }
            newShape.push(newRow);
        }
        return newShape;
    }

    tryRotate() {
        const rotated = this.rotateShape(this.shape);

        // Check the rotated shape against board and walls
        for (let i = 0; i < rotated.length; i++) {
            for (let j = 0; j < rotated[i].length; j++) {
                if (!rotated[i][j]) continue;

                const newX = this.x + j;
                const newY = this.y + i;

                if (
                    newX < 0 ||
                    newX >= grid.cols ||
                    newY < 0 ||
                    newY >= grid.rows ||
                    board[newY][newX].filled
                ) {
                    return; // invalid rotation, do nothing
                }
            }
        }

        this.shape = rotated;
    }

    lock() {
    for (let i = 0; i < this.shape.length; i++) {
        for (let j = 0; j < this.shape[i].length; j++) {
            if (this.shape[i][j]) {
                board[this.y + i][this.x + j] = { color: this.color, filled: true };
            }
        }
    }
}

    canMove(dx: number, dy: number): boolean {
        for (let i = 0; i < this.shape.length; i++) {
            for (let j = 0; j < this.shape[i].length; j++) {
                if (!this.shape[i][j]) continue;

                const newX = this.x + j + dx;
                const newY = this.y + i + dy;

                // Check walls and bottom
                if (
                    newX < 0 ||
                    newX >= grid.cols ||
                    newY >= grid.rows
                ) {
                    return false;
                }

                // Check collision with locked blocks
                if (board[newY][newX] && board[newY][newX].filled) {
                    return false;
                }
            }
        }
        return true;
    }
}

const tetrominoKeys = Object.keys(tetrominoes);

function randomTetromino(): Tetromino {
    const key = tetrominoKeys[Math.floor(Math.random() * tetrominoKeys.length)];
    return new Tetromino(tetrominoes[key]);
}

/*  Replaced for better visual style
function drawBoard() {
    ctx.fillStyle = 'blue';

    for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
            if (board[row][col] && board[row][col].filled) {
                ctx.fillStyle = board[row][col].color || 'blue';
                ctx.fillRect(
                    col * grid.size,
                    row * grid.size,
                    grid.size,
                    grid.size
                );
            }
        }
    }
}
*/

function drawBoard() {
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cell = board[row][col];

      if (cell.filled && cell.color) {
        drawBlock(col, row, cell.color);
      }
    }
  }
}

function drawSidebar() {
    const x = grid.cols * grid.size + 10;
    const width = canvas.width - x - 10;
    const boxHeight = 55;
    const gap = 35;

    const panels = [
    { label: 'SCORE', value: score.toString(), y: 20 },
    { label: 'LEVEL', value: current_level.toString(), y: 20 + boxHeight + gap },
    { label: 'LINES', value: lines.toString(), y: 20 + (boxHeight + gap) * 2 }
];

    ctx.strokeStyle = '#dadada';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Score, level, and lines: label followed by its box
    for (const panel of panels) {
        ctx.fillText(panel.label, x + width / 2, panel.y);
        ctx.strokeRect(x, panel.y + 22, width, boxHeight);

        // Center the value inside its box.
        ctx.fillText(panel.value, x + width / 2, panel.y + 49);
    }

    // Preview: no label, so it can begin shortly below the Lines box.
    const previewY = panels[2].y + 22 + boxHeight + 15;
    ctx.strokeRect(x, previewY, width, 105);
}

function getDropInterval(): number {
    return Math.max(100, 800 - current_level * 50);
}

let current_level = 0;
let score = 0;
let lines = 0;

const lineClearPoints = [0, 40, 100, 300, 1200];

let currentTetromino = randomTetromino();

let lastDropTime = 0;
//const dropInterval = 800; // milliseconds: one grid row every 0.8 seconds

function gameLoop(timestamp: number) {
    // Advance the game state only on the drop timer.
    if (timestamp - lastDropTime >= getDropInterval()) {
        if (currentTetromino.canMove(0, 1)) {
            currentTetromino.moveDown();
        } else {
            // Land the piece
            currentTetromino.lock();

const clearedLines = clearFullRows();

// Award line-clear points using the level before updating it.
if (clearedLines > 0) {
    score += lineClearPoints[clearedLines] * (current_level + 1);
    lines += clearedLines;
    current_level = Math.floor(lines / 10);
}
            // Spawn a new random piece at the top
            currentTetromino = randomTetromino();

            // Game over check – new piece cannot be placed
            if (!currentTetromino.canMove(0, 0)) {
                alert('Game over!');
                resetBoard();
            }
        }
        lastDropTime = timestamp;
    }

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the grid and board
    //drawGrid();
    drawPlayfield();
    drawBoard();
    drawSidebar();

    // Draw the current Tetromino
    currentTetromino.draw();

    // Request next frame
    requestAnimationFrame(gameLoop);
}

function resetBoard() {
    for (let row = 0; row < grid.rows; row++) {
        board[row] = Array.from(
            { length: grid.cols },
            () => ({ filled: false })
        );
    }

    score = 0;
lines = 0;
current_level = 0;
}

function clearFullRows(): number {
    let clearedLines = 0;

    for (let row = grid.rows - 1; row >= 0; row--) {
        let isRowFull = true;

        for (let col = 0; col < grid.cols; col++) {
            if (!board[row][col].filled) {
                isRowFull = false;
                break;
            }
        }

        if (isRowFull) {
            clearedLines++;

            for (let r = row; r > 0; r--) {
                board[r] = [...board[r - 1]];
            }

            board[0] = Array.from(
                { length: grid.cols },
                () => ({ filled: false })
            );

            row++;
        }
    }

    return clearedLines;
}

function softDrop() {
    if (currentTetromino.canMove(0, 1)) {
        currentTetromino.moveDown();
        score += 1;
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        if (currentTetromino.canMove(-1, 0)) {
            currentTetromino.moveLeft();
        }
    } else if (e.key === 'ArrowRight') {
        if (currentTetromino.canMove(1, 0)) {
            currentTetromino.moveRight();
        }
    } else if (e.key === 'ArrowUp') {
        currentTetromino.tryRotate();
    } else if (e.key === 'ArrowDown') {
    softDrop();
}
});

// Touch controls
let touchStartX = 0;
let touchStartY = 0;
const swipeDistance = 30;

canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();

    // Convert screen coordinates to canvas coordinates
    touchStartX = (e.clientX - rect.left) * (canvas.width / rect.width);
    touchStartY = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Continue receiving this gesture if the finger moves slightly off canvas
    canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointerup', (e) => {
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const touchEndX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const touchEndY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Swipe down: move one row down
    if (deltaY > swipeDistance && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (currentTetromino.canMove(0, 1)) {
            currentTetromino.moveDown();
        }
        return;
    }

    // Ignore left, right, and upward swipes for now
    if (Math.abs(deltaX) > swipeDistance || Math.abs(deltaY) > swipeDistance) {
        return;
    }

    // Tap in the upper quarter: rotate
    if (touchStartY < canvas.height * 0.25) {
        currentTetromino.tryRotate();
        return;
    }

    // Tap left/right half: move left/right
    if (touchStartX < canvas.width / 2) {
        if (currentTetromino.canMove(-1, 0)) {
            currentTetromino.moveLeft();
        }
    } else {
        if (currentTetromino.canMove(1, 0)) {
            currentTetromino.moveRight();
        }
    }
});

canvas.addEventListener('pointercancel', () => {
    touchStartX = 0;
    touchStartY = 0;
});

gameLoop(0);