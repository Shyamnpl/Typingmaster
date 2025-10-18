// js/game.js
document.addEventListener('DOMContentLoaded', () => {
    // --- (Saare UI elements waise hi rahenge) ---
    // ...

    // --- Game State & Settings (No changes) ---
    // ...

    // --- Helper Functions & Classes (No changes) ---
    // ...
    
    // --- CORE GAME LOGIC (WITH FIXES) ---
    
    // gameOver function ab async hai
    async function gameOver() {
        if (isGameOver) return;
        isGameOver = true;
        
        // Buttons ko disable karke "Saving..." dikhao
        pauseButton.disabled = true;
        quitButton.disabled = true;
        quitButton.textContent = "Saving...";
        pauseButton.textContent = "Saving...";

        // --- CAMERA FIX: INTEZAAR KARO JAB TAK RECORDING SAVE NA HO ---
        if (window.stopRecording) {
            await window.stopRecording(); // Yahan par code rukega
        }
        
        if (settings.sound) playAudio(gameOverSound);
        if (settings.music) bgMusic.pause();
        saveHighScore();
        words = [];
        
        // Saving poora hone ke baad UI update karo
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red'; ctx.font = `40px Courier New`;
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.getBoundingClientRect().width / 2, canvas.getBoundingClientRect().height / 2);
        inputEl.disabled = true;
        pauseButton.disabled = false; // Buttons ko wapas enable karo
        quitButton.disabled = false;
        pauseButton.textContent = "Restart";
        quitButton.textContent = "Main Menu";
    }

    // --- EVENT LISTENERS (WITH FIXES) ---
    
    // quitButton ka listener ab async hai
    quitButton.addEventListener('click', async () => {
        if (isGameOver) { // Agar game pehle se hi over hai
            showScreen(homeScreen);
            return;
        }

        isGameOver = true;
        
        // Buttons ko disable karke "Saving..." dikhao
        pauseButton.disabled = true;
        quitButton.disabled = true;
        quitButton.textContent = "Saving...";

        // --- CAMERA FIX: INTEZAAR KARO JAB TAK RECORDING SAVE NA HO ---
        if (window.stopRecording) {
            await window.stopRecording(); // Yahan par code rukega
        }

        if (settings.music) bgMusic.pause();
        saveHighScore();
        showScreen(homeScreen);
        
        // Buttons ko wapas enable karo for next time
        pauseButton.disabled = false;
        quitButton.disabled = false;
    });

    // ... (Baaki saare functions aur event listeners waise hi rahenge.
    // Neeche poora code hai for your reference)
    
    const bgMusic = document.getElementById('bg-music');
    const breakSound = document.getElementById('break-sound');
    const gameOverSound = document.getElementById('game-over-sound');
    const homeScreen = document.getElementById('home-screen');
    const gameContainer = document.getElementById('game-container');
    const settingsPanel = document.getElementById('settings-panel');
    const startGameBtn = document.getElementById('start-game-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const highScoreEl = document.getElementById('high-score');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const brokenCountEl = document.getElementById('broken-count');
    const inputEl = document.getElementById('typing-input');
    const pauseButton = document.getElementById('pauseButton');
    const pauseOverlay = document.getElementById('pause-overlay');
    const countdownOverlay = document.getElementById('countdown-overlay');

    let score = 0, brokenCount = 0, highScore = 0;
    let words = [], activeWordList = [], bullets = [];
    let animationFrameId;
    let isPaused = false, isGameOver = false, isCountingDown = false;
    let lastSpawnTime = 0;
    let hasGhostAppearedThisGame = false;
    let settings = { textSize: 'medium', difficulty: 'medium', wordTheme: 'common', sound: true, music: false };

    async function playAudio(audioElement) { try { await audioElement.play(); } catch (error) {} }
    function saveSettings() { localStorage.setItem('typingGameSettings', JSON.stringify(settings)); }
    function loadSettings() { const saved = JSON.parse(localStorage.getItem('typingGameSettings')); if (saved) settings = saved; updateSettingsUI(); }
    function updateSettingsUI() { document.querySelectorAll('.setting-choice').forEach(btn => btn.classList.remove('active')); document.querySelector(`.setting-choice[data-setting="difficulty"][data-value="${settings.difficulty}"]`).classList.add('active'); document.querySelector(`.setting-choice[data-setting="textSize"][data-value="${settings.textSize}"]`).classList.add('active'); document.getElementById('word-theme').value = settings.wordTheme; document.getElementById('sound-toggle').checked = settings.sound; document.getElementById('music-toggle').checked = settings.music; }
    function loadHighScore() { highScore = parseInt(localStorage.getItem('typingGameHighScore') || '0'); highScoreEl.textContent = highScore; }
    function saveHighScore() { if (score > highScore) { highScore = score; localStorage.setItem('typingGameHighScore', highScore); highScoreEl.textContent = highScore; } }
    function showScreen(screen) { homeScreen.classList.add('hidden'); gameContainer.classList.add('hidden'); settingsPanel.classList.add('hidden'); screen.classList.remove('hidden'); }
    function resizeCanvas() { const dpr = window.devicePixelRatio || 1; const rect = canvas.getBoundingClientRect(); canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; ctx.scale(dpr, dpr); words.forEach(word => word.recalculateX()); }
    function getFontSize() { if (settings.textSize === 'small') return 18; if (settings.textSize === 'large') return 30; return 24; }
    function getSpawnInterval() { if (settings.difficulty === 'easy') return 3000; if (settings.difficulty === 'hard') return 1500; return 2000; }
    function spawnWord() { if (isGameOver || activeWordList.length === 0) return; const randomIndex = Math.floor(Math.random() * activeWordList.length); words.push(new Word(activeWordList[randomIndex])); }
    class Bullet { constructor(targetX, targetY) { this.x = canvas.getBoundingClientRect().width / 2; this.y = canvas.getBoundingClientRect().height; this.targetX = targetX; this.targetY = targetY; this.speed = 0.15; this.size = 5; } update() { this.x += (this.targetX - this.x) * this.speed; this.y += (this.targetY - this.y) * this.speed; } draw() { ctx.fillStyle = '#00ff00'; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); } hasReachedTarget() { const dx = this.targetX - this.x; const dy = this.targetY - this.y; return Math.sqrt(dx * dx + dy * dy) < 10; } }
    class Word { constructor(word) { this.word = word; this.y = getFontSize(); this.speed = (0.3 + Math.random() * 0.4); this.isBreaking = false; this.breakTimer = 0; this.recalculateX(); } recalculateX() { ctx.font = `${getFontSize()}px Courier New`; const textWidth = ctx.measureText(this.word).width; this.x = Math.random() * (canvas.getBoundingClientRect().width - textWidth); } draw(typedText) { const fontSize = getFontSize(); ctx.font = `${fontSize}px Courier New`; if (this.isBreaking) { ctx.fillText('💥', this.x, this.y); } else { let currentX = this.x; for (let i = 0; i < this.word.length; i++) { const char = this.word[i]; ctx.fillStyle = (i < typedText.length && typedText[i] === char) ? '#4CAF50' : '#fff'; ctx.fillText(char, currentX, this.y); currentX += ctx.measureText(char).width; } } } update() { if (!this.isBreaking) this.y += this.speed; else this.breakTimer++; } }
    function updateGame() { if (isPaused || isGameOver) return; ctx.clearRect(0, 0, canvas.width, canvas.height); bullets.forEach((bullet, index) => { bullet.update(); bullet.draw(); if (bullet.hasReachedTarget()) bullets.splice(index, 1); }); if (words.length === 0 && Date.now() - lastSpawnTime > getSpawnInterval()) spawnWord(); const currentInput = inputEl.value; for (let i = words.length - 1; i >= 0; i--) { const word = words[i]; word.update(); word.draw(currentInput); if (word.breakTimer > 30) { words.splice(i, 1); lastSpawnTime = Date.now(); } if (word.y > canvas.getBoundingClientRect().height) gameOver(); } }
    function gameLoop() { if (isGameOver) return; if (!isPaused) updateGame(); animationFrameId = requestAnimationFrame(gameLoop); }
    function startCountdown() { showScreen(gameContainer); resizeCanvas(); isCountingDown = true; inputEl.disabled = false; inputEl.value = ''; inputEl.focus(); countdownOverlay.classList.remove('hidden'); let count = 3; countdownOverlay.textContent = count; if (settings.music) { bgMusic.muted = true; playAudio(bgMusic); } const interval = setInterval(() => { count--; countdownOverlay.textContent = count > 0 ? count : 'GO!'; if (count < 0) { clearInterval(interval); countdownOverlay.classList.add('hidden'); actuallyStartGame(); } }, 1000); }
    function actuallyStartGame() { isCountingDown = false; isGameOver = false; isPaused = false; score = 0; brokenCount = 0; words = []; hasGhostAppearedThisGame = false; activeWordList = wordLists[settings.wordTheme] || wordLists.common; scoreEl.textContent = score; brokenCountEl.textContent = brokenCount; inputEl.disabled = false; inputEl.focus(); pauseButton.textContent = "Pause"; quitButton.textContent = "Quit"; if (animationFrameId) cancelAnimationFrame(animationFrameId); spawnWord(); lastSpawnTime = Date.now(); if (window.startRecording) window.startRecording(); if (settings.music) { bgMusic.currentTime = 0; bgMusic.muted = false; playAudio(bgMusic); } gameLoop(); }
    function togglePause() { if (isGameOver) return; isPaused = !isPaused; pauseOverlay.classList.toggle('hidden', !isPaused); inputEl.disabled = isPaused; pauseButton.textContent = isPaused ? "Resume" : "Pause"; if (!isPaused) inputEl.focus(); }
    window.addEventListener('resize', resizeCanvas);
    startGameBtn.addEventListener('click', startCountdown);
    settingsBtn.addEventListener('click', () => showScreen(settingsPanel));
    document.getElementById('close-settings-btn').addEventListener('click', () => showScreen(homeScreen));
    pauseButton.addEventListener('click', () => { if (isGameOver) { startCountdown(); } else { togglePause(); } });
    let previousInput = "";
    inputEl.addEventListener('input', () => { if (isCountingDown) { inputEl.value = ''; return; } if (isPaused || isGameOver) return; const typedWord = inputEl.value; const currentWord = words.find(w => !w.isBreaking); if (currentWord) { if (typedWord.length > previousInput.length && currentWord.word.startsWith(typedWord)) { const charIndex = typedWord.length - 1; const char = currentWord.word[charIndex]; const precedingText = currentWord.word.substring(0, charIndex); ctx.font = `${getFontSize()}px Courier New`; const targetX = currentWord.x + ctx.measureText(precedingText).width + (ctx.measureText(char).width / 2); const targetY = currentWord.y - (getFontSize() / 2); bullets.push(new Bullet(targetX, targetY)); } } previousInput = typedWord; if (currentWord && currentWord.word === typedWord) { currentWord.isBreaking = true; score += 10; brokenCount++; scoreEl.textContent = score; brokenCountEl.textContent = brokenCount; inputEl.value = ''; previousInput = ''; if (settings.sound) { breakSound.currentTime = 0; playAudio(breakSound); } if (brokenCount >= 5 && brokenCount <= 9 && !hasGhostAppearedThisGame) { hasGhostAppearedThisGame = true; } } });
    settingsPanel.addEventListener('click', (e) => { if (e.target.matches('.setting-choice')) { const setting = e.target.dataset.setting; const value = e.target.dataset.value; settings[setting] = value; document.querySelectorAll(`.setting-choice[data-setting="${setting}"]`).forEach(btn => btn.classList.remove('active')); e.target.classList.add('active'); saveSettings(); } });
    document.getElementById('sound-toggle').addEventListener('change', (e) => { settings.sound = e.target.checked; saveSettings(); });
    document.getElementById('music-toggle').addEventListener('change', (e) => { settings.music = e.target.checked; saveSettings(); });
    document.getElementById('word-theme').addEventListener('change', (e) => { settings.wordTheme = e.target.value; saveSettings(); });
    loadSettings(); loadHighScore(); showScreen(homeScreen);
});
