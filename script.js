"use strict";
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
const board = Array.from({ length: grid.rows }, () => Array(grid.cols).fill(0));
function drawGrid() {
    for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
            ctx.strokeStyle = '#ddd';
            ctx.strokeRect(col * grid.size, row * grid.size, grid.size, grid.size);
        }
    }
}
const tetrominoes = {
    'I': [
        [1, 1, 1, 1]
    ],
    'O': [
        [1, 1],
        [1, 1]
    ],
    'T': [
        [0, 1, 0],
        [1, 1, 1]
    ]
};
class Tetromino {
    shape;
    x;
    y;
    constructor(shape) {
        this.shape = shape;
        this.x = Math.floor((grid.cols / 2) - (shape[0].length / 2));
        this.y = 0;
    }
    draw() {
        ctx.fillStyle = 'blue';
        for (let i = 0; i < this.shape.length; i++) {
            for (let j = 0; j < this.shape[i].length; j++) {
                if (this.shape[i][j]) {
                    ctx.fillRect((this.x + j) * grid.size, (this.y + i) * grid.size, grid.size, grid.size);
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
    moveUp() {
        this.y--;
    }
    rotate() {
        const newShape = [];
        for (let i = 0; i < this.shape[0].length; i++) {
            const newRow = [];
            for (let j = this.shape.length - 1; j >= 0; j--) {
                newRow.push(this.shape[j][i]);
            }
            newShape.push(newRow);
        }
        this.shape = newShape;
    }
    collidesWithWalls() {
        for (let i = 0; i < this.shape.length; i++) {
            for (let j = 0; j < this.shape[i].length; j++) {
                if (this.shape[i][j]) {
                    const newX = this.x + j;
                    const newY = this.y + i;
                    if (newX < 0 || newX >= grid.cols || newY >= grid.rows) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    collidesWithTetromino(tetromino) {
        for (let i = 0; i < this.shape.length; i++) {
            for (let j = 0; j < this.shape[i].length; j++) {
                if (this.shape[i][j]) {
                    const newX = this.x + j;
                    const newY = this.y + i;
                    if (tetromino.shape[newY - tetromino.y] && tetromino.shape[newY - tetromino.y][newX - tetromino.x]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    lock() {
        for (let i = 0; i < this.shape.length; i++) {
            for (let j = 0; j < this.shape[i].length; j++) {
                if (this.shape[i][j]) {
                    board[this.y + i][this.x + j] = 1;
                }
            }
        }
    }
    canMove(dx, dy) {
        for (let i = 0; i < this.shape.length; i++) {
            for (let j = 0; j < this.shape[i].length; j++) {
                if (!this.shape[i][j])
                    continue;
                const newX = this.x + j + dx;
                const newY = this.y + i + dy;
                if (newX < 0 ||
                    newX >= grid.cols ||
                    newY >= grid.rows) {
                    return false;
                }
            }
        }
        return true;
    }
}
function drawBoard() {
    ctx.fillStyle = 'blue';
    for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
            if (board[row][col]) {
                ctx.fillRect(col * grid.size, row * grid.size, grid.size, grid.size);
            }
        }
    }
}
let currentTetromino = new Tetromino(tetrominoes['I']);
let nextTetromino;
let lastDropTime = 0;
const dropInterval = 500; // milliseconds: one grid row every 0.5 seconds
function gameLoop(timestamp) {
    // Advance the game state only on the drop timer.
    if (timestamp - lastDropTime >= dropInterval) {
        currentTetromino.moveDown();
        if (currentTetromino.collidesWithWalls()) {
            currentTetromino.moveUp();
            currentTetromino.lock();
            currentTetromino = new Tetromino(tetrominoes['I']);
        }
        lastDropTime = timestamp;
    }
    // Draw every animation frame.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawBoard();
    currentTetromino.draw();
    requestAnimationFrame(gameLoop);
}
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        currentTetromino.moveLeft();
    }
    else if (e.key === 'ArrowRight') {
        currentTetromino.moveRight();
    }
    else if (e.key === 'ArrowUp') {
        currentTetromino.rotate();
    }
});
gameLoop(0);
