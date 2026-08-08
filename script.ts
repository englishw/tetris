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

function drawGrid() {
    for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
            ctx.strokeStyle = '#ddd';
            ctx.strokeRect(col * grid.size, row * grid.size, grid.size, grid.size);
        }
    }
}

const tetrominoes: { [key: string]: { shape: number[][], color: string } } = {
    'I': {
        shape: [
            [1, 1, 1, 1]
        ],
        color: 'lightblue'
    },
    'O': {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: 'yellow'
    },
    'T': {
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ],
        color: 'purple'
    },
    'S': {
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        color: 'green'
    },
    'Z': {
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        color: 'red'
    },
    'J': {
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ],
        color: 'darkblue'
    },
    'L': {
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ],
        color: 'orange'
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

let currentTetromino = randomTetromino();

let lastDropTime = 0;
const dropInterval = 500; // milliseconds: one grid row every 0.5 seconds

function gameLoop(timestamp: number) {
    // Advance the game state only on the drop timer.
    if (timestamp - lastDropTime >= dropInterval) {
        if (currentTetromino.canMove(0, 1)) {
            currentTetromino.moveDown();
        } else {
            // Land the piece
            currentTetromino.lock();
            clearFullRows();
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
    drawGrid();
    drawBoard();

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
}

function clearFullRows() {
    for (let row = grid.rows - 1; row >= 0; row--) {
        let isRowFull = true;
        for (let col = 0; col < grid.cols; col++) {
            if (!board[row][col].filled) {
                isRowFull = false;
                break;
            }
        }

        if (isRowFull) {
            // Shift all rows above this one down
            for (let r = row; r > 0; r--) {
                board[r] = [...board[r - 1]];
            }
            board[0] = Array(grid.cols).fill(0);

            row++; // re-check this row, a new row has fallen into it
        }
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
        if (currentTetromino.canMove(0, 1)) {
            currentTetromino.moveDown();
        }
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