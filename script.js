// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 8;
const PADDLE_SPEED = 6;
const BALL_SPEED = 4;
const MAX_BALL_SPEED = 8;
const AI_DIFFICULTY = 0.85; // 0-1, higher = better AI

// Game Objects
let canvas, ctx;
let gameRunning = false;
let gameStarted = false;

const game = {
    playerScore: 0,
    computerScore: 0,
    
    playerPaddle: {
        x: 10,
        y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        dy: 0
    },
    
    computerPaddle: {
        x: CANVAS_WIDTH - PADDLE_WIDTH - 10,
        y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        dy: 0
    },
    
    ball: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        size: BALL_SIZE,
        dx: BALL_SPEED,
        dy: BALL_SPEED,
        speed: BALL_SPEED
    }
};

// Input handling
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    mouseY: CANVAS_HEIGHT / 2
};

let joystickActive = false;
let joystickY = 0;

// Initialize Game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Keyboard events
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') keys.ArrowUp = true;
        if (e.key === 'ArrowDown') keys.ArrowDown = true;
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowUp') keys.ArrowUp = false;
        if (e.key === 'ArrowDown') keys.ArrowDown = false;
    });
    
    // Mouse events
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        keys.mouseY = e.clientY - rect.top;
    });
    
    // Joystick events
    setupJoystick();
    
    // Button events
    document.getElementById('startBtn').addEventListener('click', toggleGame);
    document.getElementById('resetBtn').addEventListener('click', resetScore);
    
    // Start game loop
    gameLoop();
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    const maxWidth = Math.min(800, rect.width - 40);
    const scale = maxWidth / CANVAS_WIDTH;
    
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.width = (CANVAS_WIDTH * scale) + 'px';
    canvas.style.height = (CANVAS_HEIGHT * scale) + 'px';
}

// Joystick Setup
function setupJoystick() {
    const joystickBase = document.getElementById('joystickBase');
    const joystickHandle = document.getElementById('joystickHandle');
    const joystickContainer = document.getElementById('joystickContainer');
    
    joystickBase.addEventListener('touchstart', (e) => {
        joystickActive = true;
        updateJoystickPosition(e);
    });
    
    joystickBase.addEventListener('touchmove', (e) => {
        if (joystickActive) {
            updateJoystickPosition(e);
        }
    });
    
    joystickBase.addEventListener('touchend', () => {
        joystickActive = false;
        joystickY = 0;
        joystickHandle.style.transform = 'translate(-50%, -50%)';
    });
    
    function updateJoystickPosition(e) {
        const touch = e.touches[0];
        const rect = joystickBase.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const dy = touch.clientY - centerY;
        const distance = Math.min(Math.abs(dy), rect.height / 2 - 25);
        
        joystickY = dy > 0 ? distance : -distance;
        const movePercent = (joystickY / (rect.height / 2 - 25)) * 40;
        
        joystickHandle.style.transform = `translate(-50%, calc(-50% + ${movePercent}px))`;
    }
}

// Game Functions
function toggleGame() {
    if (!gameStarted) {
        gameStarted = true;
        gameRunning = true;
        document.getElementById('startBtn').textContent = 'Pause';
    } else if (gameRunning) {
        gameRunning = false;
        document.getElementById('startBtn').textContent = 'Resume';
    } else {
        gameRunning = true;
        document.getElementById('startBtn').textContent = 'Pause';
    }
}

function resetScore() {
    game.playerScore = 0;
    game.computerScore = 0;
    updateScoreboard();
    resetBall();
    gameRunning = false;
    gameStarted = false;
    document.getElementById('startBtn').textContent = 'Start Game';
}

function resetBall() {
    game.ball.x = CANVAS_WIDTH / 2;
    game.ball.y = CANVAS_HEIGHT / 2;
    game.ball.speed = BALL_SPEED;
    const angle = (Math.random() - 0.5) * Math.PI / 4;
    game.ball.dx = BALL_SPEED * Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1);
    game.ball.dy = BALL_SPEED * Math.sin(angle);
}

function updateScoreboard() {
    document.getElementById('playerScore').textContent = game.playerScore;
    document.getElementById('computerScore').textContent = game.computerScore;
}

// Update Functions
function update() {
    if (!gameRunning) return;
    
    // Player paddle movement
    if (keys.ArrowUp) {
        game.playerPaddle.y = Math.max(0, game.playerPaddle.y - PADDLE_SPEED);
    }
    if (keys.ArrowDown) {
        game.playerPaddle.y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, game.playerPaddle.y + PADDLE_SPEED);
    }
    
    // Mouse control
    const targetY = keys.mouseY - PADDLE_HEIGHT / 2;
    const diff = targetY - game.playerPaddle.y;
    if (Math.abs(diff) > 5) {
        game.playerPaddle.y += Math.sign(diff) * PADDLE_SPEED * 0.5;
    }
    
    // Joystick control (mobile)
    if (joystickActive && joystickY !== 0) {
        game.playerPaddle.y += joystickY * 0.1;
    }
    
    // Clamp player paddle
    game.playerPaddle.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, game.playerPaddle.y));
    
    // Computer AI
    updateComputerAI();
    
    // Ball movement
    game.ball.x += game.ball.dx;
    game.ball.y += game.ball.dy;
    
    // Ball collision with top and bottom
    if (game.ball.y - game.ball.size < 0 || game.ball.y + game.ball.size > CANVAS_HEIGHT) {
        game.ball.dy *= -1;
        game.ball.y = Math.max(game.ball.size, Math.min(CANVAS_HEIGHT - game.ball.size, game.ball.y));
    }
    
    // Ball collision with paddles
    checkPaddleCollision(game.playerPaddle);
    checkPaddleCollision(game.computerPaddle);
    
    // Scoring
    if (game.ball.x - game.ball.size < 0) {
        game.computerScore++;
        updateScoreboard();
        resetBall();
        checkGameOver();
    } else if (game.ball.x + game.ball.size > CANVAS_WIDTH) {
        game.playerScore++;
        updateScoreboard();
        resetBall();
        checkGameOver();
    }
}

function updateComputerAI() {
    const paddleCenter = game.computerPaddle.y + PADDLE_HEIGHT / 2;
    const ballCenter = game.ball.y;
    const distance = ballCenter - paddleCenter;
    
    // AI difficulty: higher = more accurate
    if (Math.random() < AI_DIFFICULTY) {
        if (distance > 20) {
            game.computerPaddle.y = Math.min(
                CANVAS_HEIGHT - PADDLE_HEIGHT,
                game.computerPaddle.y + PADDLE_SPEED * 0.8
            );
        } else if (distance < -20) {
            game.computerPaddle.y = Math.max(
                0,
                game.computerPaddle.y - PADDLE_SPEED * 0.8
            );
        }
    } else {
        // Random movement for AI mistakes
        if (Math.random() > 0.5) {
            game.computerPaddle.y = Math.min(
                CANVAS_HEIGHT - PADDLE_HEIGHT,
                game.computerPaddle.y + PADDLE_SPEED * 0.5
            );
        } else {
            game.computerPaddle.y = Math.max(
                0,
                game.computerPaddle.y - PADDLE_SPEED * 0.5
            );
        }
    }
}

function checkPaddleCollision(paddle) {
    const ballLeft = game.ball.x - game.ball.size;
    const ballRight = game.ball.x + game.ball.size;
    const ballTop = game.ball.y - game.ball.size;
    const ballBottom = game.ball.y + game.ball.size;
    
    const paddleLeft = paddle.x;
    const paddleRight = paddle.x + paddle.width;
    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + paddle.height;
    
    if (ballLeft < paddleRight && ballRight > paddleLeft &&
        ballTop < paddleBottom && ballBottom > paddleTop) {
        
        // Calculate where on the paddle the ball hit (0 = top, 1 = bottom)
        const hitPos = (game.ball.y - paddleTop) / paddle.height;
        const angle = (hitPos - 0.5) * Math.PI / 4;
        
        // Reverse ball direction
        game.ball.dx *= -1;
        
        // Add spin based on paddle position
        game.ball.dy = Math.sin(angle) * game.ball.speed;
        
        // Increase speed slightly (up to max)
        game.ball.speed = Math.min(MAX_BALL_SPEED, game.ball.speed + 0.2);
        
        // Update ball velocity magnitude
        const currentSpeed = Math.sqrt(game.ball.dx ** 2 + game.ball.dy ** 2);
        game.ball.dx = (game.ball.dx / currentSpeed) * game.ball.speed;
        game.ball.dy = (game.ball.dy / currentSpeed) * game.ball.speed;
        
        // Prevent ball from getting stuck
        if (paddle === game.playerPaddle) {
            game.ball.x = paddleRight + game.ball.size;
        } else {
            game.ball.x = paddleLeft - game.ball.size;
        }
    }
}

function checkGameOver() {
    if (game.playerScore >= 11 || game.computerScore >= 11) {
        gameRunning = false;
        const winner = game.playerScore >= 11 ? 'You' : 'Computer';
        setTimeout(() => {
            alert(`${winner} Won! Final Score: ${game.playerScore} - ${game.computerScore}`);
        }, 100);
    }
}

// Draw Functions
function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(26, 26, 46, 0.95)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw paddles
    drawPaddle(game.playerPaddle, '#667eea');
    drawPaddle(game.computerPaddle, '#764ba2');
    
    // Draw ball
    drawBall();
}

function drawPaddle(paddle, color) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;
}

function drawBall() {
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(game.ball.x, game.ball.y, game.ball.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Game Loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start on load
window.addEventListener('DOMContentLoaded', init);
