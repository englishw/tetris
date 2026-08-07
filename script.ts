const canvas = document.createElement('canvas');
canvas.width = 320;
canvas.height = 640;
const ctx = canvas.getContext('2d')!;
document.getElementById('game-container')!.appendChild(canvas);

class Tetromino {
    private shape: number[][];
    private x: number;
    private y: number;

    constructor(shape: number[][]) {
        this.shape = shape;
        this.x = Math.floor((canvas.width / 20) - (shape[0].length / 2));
        this.y = 0;
    }

    draw() {
        ctx.fillStyle = 'blue';
        for (let i = 0; i < this.shape.length; i++) {
            for (let j = 0; j < this.shape[i].length; j++) {
                if (this.shape[i][j]) {
                    ctx.fillRect((this.x + j) * 20, (this.y + i) * 20, 20, 20);
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

    rotate() {
        const newShape = [];
        for (let i = 0; i < this.shape[0].length; i++) {
            const newRow: number[] = [];
            for (let j = this.shape.length - 1; j >= 0; j--) {
                newRow.push(this.shape[j][i]);
            }
            newShape.push(newRow);
        }
        this.shape = newShape;
    }
}

const tetrominoes: { [key: string]: number[][] } = {
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
    ],
    // Add more tetrominoes as needed
};

const currentTetromino = new Tetromino(tetrominoes['I']);

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    currentTetromino.moveDown();
    currentTetromino.draw();

    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        currentTetromino.moveLeft();
    } else if (e.key === 'ArrowRight') {
        currentTetromino.moveRight();
    } else if (e.key === 'ArrowUp') {
        currentTetromino.rotate();
    }
});

gameLoop();
