document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const scoreEl = document.getElementById('score');
    const brokenCountEl = document.getElementById('broken-count');
    const inputEl = document.getElementById('typing-input');
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');
    const ghostOverlay = document.getElementById('ghost-overlay');

    let score = 0;
    let brokenCount = 0;
    let words = [];
    let gameLoop;
    let isPaused = false;
    let isGameOver = false;
    let lastSpawnTime = 0;
    const SPAWN_INTERVAL = 500;

    // The canvas resolution is set here. CSS will scale it to fit the flexible container.
    function setCanvasResolution() {
        canvas.width = 500;
        canvas.height = 700;
    }
    setCanvasResolution();


    class Word {
        constructor(word) {
            this.word = word;
            const textWidth = ctx.measureText(word).width;
            this.x = Math.random() * (canvas.width - textWidth);
            this.y = 20;
            this.speed = (0.3 + Math.random() * 0.4); // Adjusted speed for the new layout
            this.isBreaking = false;
            this.breakTimer = 0;
        }

        draw() {
            const fontSize = 20;
            ctx.font = `${fontSize}px Courier New`;
            if (this.isBreaking) {
                ctx.fillStyle = `rgba(255, 255, 0, ${1 - this.breakTimer / 30})`;
                ctx.font = `${fontSize + 4}px Courier New`;
                ctx.fillText('💥', this.x, this.y);
            } else {
                ctx.fillStyle = '#fff';
                ctx.fillText(this.word, this.x, this.y);
            }
        }
        update() {
            if (!this.isBreaking) this.y += this.speed;
            else this.breakTimer++;
        }
    }

    function spawnWord() {
        // --- BUG FIX ---
        // Extra safeguard: Never spawn words if the game is over.
        if (isGameOver) return;
        const randomIndex = Math.floor(Math.random() * wordList.length);
        words.push(new Word(wordList[randomIndex]));
    }

    function updateGame() {
        if (isPaused || isGameOver) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (words.length === 0 && Date.now() - lastSpawnTime > SPAWN_INTERVAL) {
            spawnWord();
        }

        words.forEach((word, index) => {
            word.update();
            word.draw();
            if (word.breakTimer > 30) {
                words.splice(index, 1);
                lastSpawnTime = Date.now();
            }
            if (word.y > canvas.height) gameOver();
        });
    }

    function gameCycle() {
        // --- BUG FIX ---
        // This is the most important fix. If the game is over, stop the loop entirely.
        if (isGameOver) {
            cancelAnimationFrame(gameLoop);
            return;
        }
        updateGame();
        gameLoop = requestAnimationFrame(gameCycle);
    }

    function startGame() {
        isGameOver = false; // Reset the game over flag
        isPaused = false;
        score = 0;
        brokenCount = 0;
        words = [];
        scoreEl.textContent = score;
        brokenCountEl.textContent = brokenCount;
        inputEl.disabled = false;
        inputEl.value = '';
        inputEl.focus();
        startButton.textContent = 'Restart Game';

        if (gameLoop) cancelAnimationFrame(gameLoop);
        
        spawnWord();
        lastSpawnTime = Date.now();

        if (window.startRecording) window.startRecording();

        gameCycle(); // Start the main game loop
    }

    function gameOver() {
        isGameOver = true; // Set the flag
        cancelAnimationFrame(gameLoop); // Stop any future frames

        ctx.fillStyle = 'red';
        ctx.font = `40px Courier New`;
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        inputEl.disabled = true;
    }

    function togglePause() {
        if (isGameOver) return;
        isPaused = !isPaused;
        inputEl.disabled = isPaused;
        pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
        if (!isPaused) {
            inputEl.focus();
            gameCycle();
        }
    }

    function showGhost() {
        ghostOverlay.classList.remove('hidden');
        ghostOverlay.style.opacity = 1;
        
        if (window.stopRecording) {
            setTimeout(() => {
                window.stopRecording();
            }, 5000);
        }

        setTimeout(() => {
            ghostOverlay.style.opacity = 0;
            setTimeout(() => ghostOverlay.classList.add('hidden'), 500);
        }, 1500);
    }

    inputEl.addEventListener('input', () => {
        if (isPaused || isGameOver) return;

        const typedWord = inputEl.value;
        const currentWord = words.find(w => !w.isBreaking);

        if (currentWord && currentWord.word === typedWord) {
            currentWord.isBreaking = true;
            score += 10;
            brokenCount++;
            scoreEl.textContent = score;
            brokenCountEl.textContent = brokenCount;

            if (brokenCount >= 5 && brokenCount <= 9) {
                showGhost();
            }

            inputEl.value = '';
        }
    });

    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
});