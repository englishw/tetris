"use strict";
/*
*   TETRIS clone, based on Gameboy versions of the classic game
*   Bill English, 2026
*/
const canvas = document.createElement('canvas');
canvas.width = 320;
canvas.height = 640;
const ctx = canvas.getContext('2d');
document.getElementById('game-container').appendChild(canvas);
const grid = {
    rows: 20,
    cols: 10,
    size: 20
};
const board = Array.from(// Initialize the game board with empty cells
{ length: grid.rows }, () => Array.from({ length: grid.cols }, () => ({ filled: false })));
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
    // Main dark-purple well
    ctx.fillStyle = palette.playfield;
    ctx.fillRect(0, 0, width, height);
    // A few subtle background pixels add visual depth
    ctx.fillStyle = palette.emptySpeck;
    for (const [x, y] of [[2, 2], [5, 5], [8, 8], [3, 13], [7, 17]]) {
        ctx.fillRect(x * grid.size + 8, y * grid.size + 9, 3, 3);
    }
}
function shadeColor(hex, amount) {
    const value = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (value >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((value >> 8) & 0xff) + amount));
    const b = Math.max(0, Math.min(255, (value & 0xff) + amount));
    return `rgb(${r}, ${g}, ${b})`;
}
function drawBlock(col, row, color) {
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
const tetrominoes = {
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
    shape;
    x;
    y;
    color;
    constructor(shape) {
        this.shape = shape.shape;
        this.color = shape.color;
        this.x = Math.floor((grid.cols / 2) - (shape.shape[0].length / 2));
        this.y = 0; // Adjusted to start above the grid
    }
    // Draw the tetromino on the board
    draw() {
        for (let i = 0; i < this.shape.length; i++) {
            for (let j = 0; j < this.shape[i].length; j++) {
                if (this.shape[i][j]) {
                    drawBlock(this.x + j, this.y + i, this.color);
                }
            }
        }
    }
    // Draw a preview of the tetromino in the sidebar
    drawPreview(boxX, boxY, boxWidth, boxHeight) {
        const previewSize = 16;
        const pieceWidth = this.shape[0].length * previewSize;
        const pieceHeight = this.shape.length * previewSize;
        const startX = boxX + (boxWidth - pieceWidth) / 2;
        const startY = boxY + (boxHeight - pieceHeight) / 2;
        for (let i = 0; i < this.shape.length; i++) {
            for (let j = 0; j < this.shape[i].length; j++) {
                if (!this.shape[i][j])
                    continue;
                const x = startX + j * previewSize;
                const y = startY + i * previewSize;
                ctx.fillStyle = shadeColor(this.color, -90);
                ctx.fillRect(x, y, previewSize, previewSize);
                ctx.fillStyle = this.color;
                ctx.fillRect(x + 2, y + 2, previewSize - 4, previewSize - 4);
                ctx.fillStyle = shadeColor(this.color, 55);
                ctx.fillRect(x + 3, y + 3, previewSize - 6, 2);
                ctx.fillStyle = shadeColor(this.color, -45);
                ctx.fillRect(x + 3, y + previewSize - 5, previewSize - 6, 2);
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
    rotateShape(shape) {
        const newShape = [];
        for (let i = 0; i < shape[0].length; i++) {
            const newRow = [];
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
                if (!rotated[i][j])
                    continue;
                const newX = this.x + j;
                const newY = this.y + i;
                if (newX < 0 ||
                    newX >= grid.cols ||
                    newY < 0 ||
                    newY >= grid.rows ||
                    board[newY][newX].filled) {
                    return; // invalid rotation, do nothing
                }
            }
        }
        this.shape = rotated;
    }
    // Lock the tetromino in place on the board
    lock() {
        for (let i = 0; i < this.shape.length; i++) {
            for (let j = 0; j < this.shape[i].length; j++) {
                if (this.shape[i][j]) {
                    board[this.y + i][this.x + j] = { color: this.color, filled: true };
                }
            }
        }
    }
    // Check if the tetromino can move to a new position
    canMove(dx, dy) {
        for (let i = 0; i < this.shape.length; i++) {
            for (let j = 0; j < this.shape[i].length; j++) {
                if (!this.shape[i][j])
                    continue;
                const newX = this.x + j + dx;
                const newY = this.y + i + dy;
                // Check walls and bottom
                if (newX < 0 ||
                    newX >= grid.cols ||
                    newY >= grid.rows) {
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
// Get the keys of the tetrominoes object
const tetrominoKeys = Object.keys(tetrominoes);
function randomTetromino() {
    const key = tetrominoKeys[Math.floor(Math.random() * tetrominoKeys.length)];
    return new Tetromino(tetrominoes[key]);
}
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
    nextTetromino.drawPreview(x, previewY, width, 105);
}
function getDropInterval() {
    return Math.max(100, 800 - current_level * 50);
}
let current_level = 0; // Initialize the game level
let score = 0; // Initialize the score
let lines = 0; // Initialize the number of lines cleared
const lineClearPoints = [0, 40, 100, 300, 1200];
let currentTetromino = randomTetromino(); // Generate the first tetromino
let nextTetromino = randomTetromino(); // Generate the preview tetromino
let lastDropTime = 0; // Initialize the last drop time
function gameLoop(timestamp) {
    // Only apply automatic gravity when the current drop interval has elapsed.
    if (timestamp - lastDropTime >= getDropInterval()) {
        if (currentTetromino.canMove(0, 1)) {
            currentTetromino.moveDown();
        }
        else {
            // The piece cannot move farther down, so lock it, clear lines,
            // update score/level, and spawn the next piece.
            landCurrentTetromino();
        }
        // Restart the gravity timer after either moving or landing.
        lastDropTime = timestamp;
    }
    // Redraw the complete game screen every animation frame.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayfield();
    drawBoard();
    drawSidebar();
    // Draw this after the locked board so the active piece appears on top.
    currentTetromino.draw();
    requestAnimationFrame(gameLoop);
}
function resetBoard() {
    for (let row = 0; row < grid.rows; row++) {
        board[row] = Array.from({ length: grid.cols }, () => ({ filled: false }));
    }
    score = 0;
    lines = 0;
    current_level = 0;
    currentTetromino = randomTetromino();
    nextTetromino = randomTetromino();
    lastDropTime = performance.now();
}
function clearFullRows() {
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
            // Move all rows above the cleared row down by one
            for (let r = row; r > 0; r--) {
                board[r] = [...board[r - 1]];
            }
            // Clear the topmost row
            board[0] = Array.from({ length: grid.cols }, () => ({ filled: false }));
            row++; // Stay on the same row to check for multiple full rows
        }
    }
    return clearedLines;
}
// new 8/9/26:
function spawnNextTetromino() {
    currentTetromino = nextTetromino;
    nextTetromino = randomTetromino();
    if (!currentTetromino.canMove(0, 0)) {
        alert('Game over!');
        resetBoard();
    }
}
// new 8/9/26:
function landCurrentTetromino() {
    currentTetromino.lock();
    const clearedLines = clearFullRows();
    if (clearedLines > 0) {
        score += lineClearPoints[clearedLines] * (current_level + 1);
        lines += clearedLines;
        current_level = Math.floor(lines / 10);
    }
    spawnNextTetromino();
}
// new 8/9/26:
function hardDrop() {
    let droppedRows = 0;
    while (currentTetromino.canMove(0, 1)) {
        currentTetromino.moveDown();
        droppedRows++;
    }
    score += droppedRows * 2;
    landCurrentTetromino();
    // Give the newly spawned piece a full drop interval.
    lastDropTime = performance.now();
}
function softDrop() {
    if (currentTetromino.canMove(0, 1)) {
        currentTetromino.moveDown();
        score += 1; // Award points for soft dropping
    }
}
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (currentTetromino.canMove(-1, 0)) {
            currentTetromino.moveLeft();
        }
    }
    else if (e.key === 'ArrowRight' || e.key === 'd') {
        if (currentTetromino.canMove(1, 0)) {
            currentTetromino.moveRight();
        }
    }
    else if (e.key === 'ArrowUp' || e.key === 'w') {
        currentTetromino.tryRotate();
    }
    else if (e.key === 'ArrowDown' || e.key === 's') {
        softDrop();
    }
});
// Touch controls
let touchStartX = 0;
let touchStartY = 0;
let lastMoveX = 0;
let lastMoveY = 0;
let activePointerId = null;
let hardDropUsedThisGesture = false;
const swipeDistance = 30;
const tapDistance = 12;
canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    touchStartX = x;
    touchStartY = y;
    lastMoveX = x;
    lastMoveY = y;
    activePointerId = e.pointerId;
    // Keep receiving movement/up events even if the finger leaves the canvas.
    canvas.setPointerCapture(e.pointerId);
    hardDropUsedThisGesture = false;
});
canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activePointerId || hardDropUsedThisGesture)
        return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const currentY = (e.clientY - rect.top) * (canvas.height / rect.height);
    const deltaX = currentX - lastMoveX;
    const deltaY = currentY - lastMoveY;
    // Downward swipe: hard-drop and lock the piece.
    if (deltaY >= swipeDistance && Math.abs(deltaY) > Math.abs(deltaX)) {
        hardDrop();
        // Ignore further movement until this finger is released.
        hardDropUsedThisGesture = true;
        return;
    }
    // Horizontal drag/swipe: move once per swipeDistance crossed.
    if (Math.abs(deltaX) >= swipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
            if (currentTetromino.canMove(-1, 0)) {
                currentTetromino.moveLeft();
            }
        }
        else {
            if (currentTetromino.canMove(1, 0)) {
                currentTetromino.moveRight();
            }
        }
        // Reset only the horizontal reference point, allowing repeated movement
        // while the player continues dragging/holding left or right.
        lastMoveX = currentX;
    }
});
canvas.addEventListener('pointerup', (e) => {
    if (e.pointerId !== activePointerId)
        return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touchEndX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const touchEndY = (e.clientY - rect.top) * (canvas.height / rect.height);
    const totalDeltaX = touchEndX - touchStartX;
    const totalDeltaY = touchEndY - touchStartY;
    // A small, stationary tap rotates the piece.
    if (Math.abs(totalDeltaX) < tapDistance &&
        Math.abs(totalDeltaY) < tapDistance) {
        currentTetromino.tryRotate();
    }
    if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
    }
    activePointerId = null;
    hardDropUsedThisGesture = false;
});
canvas.addEventListener('pointercancel', (e) => {
    if (e.pointerId === activePointerId) {
        activePointerId = null;
        touchStartX = 0;
        touchStartY = 0;
        lastMoveX = 0;
        lastMoveY = 0;
        hardDropUsedThisGesture = false;
    }
});
gameLoop(0);
