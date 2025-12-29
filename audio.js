let gameIsOver = false;
let audioUnlocked = false;
let walking = false;

const bgMusic = new Audio("./sounds/console84.mp3");
const walkSound = new Audio("./sounds/walk.mp3");
const jumpSounds = [
  { sound: new Audio("./sounds/jump/jump-cut.mp3"), baseVol: 0.35 },
  { sound: new Audio("./sounds/jump/pop-jump-1.mp3"), baseVol: 0.45 },
];
const errorSound = new Audio("./sounds/erro.mp3");
const gameOverSounds = [
  new Audio("./sounds/gameEnd/bruhh.mp3"),
  new Audio("./sounds/gameEnd/fahhh.mp3"),
];

bgMusic.loop = true;
bgMusic.volume = 0.1;
walkSound.loop = true;
walkSound.volume = 0.5;

jumpSounds.forEach(({ sound }) => {
  sound.loop = false;
});

errorSound.loop = false;
errorSound.volume = 0.4;

gameOverSounds.forEach((sound) => {
  sound.loop = false;
  sound.volume = 0.6;
});

function startBackgroundMusic() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  bgMusic
    .play()
    .then(() => {
      bgMusic.currentTime = 0;
    })
    .catch(() => {});
  walkSound
    .play()
    .then(() => {
      walkSound.pause();
      walkSound.currentTime = 0;
    })
    .catch(() => {});
  errorSound
    .play()
    .then(() => {
      errorSound.pause();
      errorSound.currentTime = 0;
    })
    .catch(() => {});
  bgMusic.currentTime = 0;
  bgMusic.play().catch(() => {});
}
const startBtn = document.getElementById("startBtn");
if (startBtn) {
  startBtn.addEventListener("click", () => {
    gameIsOver = false;
    gameOverSounds.forEach((s) => {
      s.pause();
      s.currentTime = 0;
    });
    startBackgroundMusic();
  });
}

function playJumpSound() {
  const { sound, baseVol } =
    jumpSounds[Math.floor(Math.random() * jumpSounds.length)];
  sound.pause();
  sound.currentTime = 0;
  sound.volume = baseVol * (0.85 + Math.random() * 0.3);
  sound.playbackRate = 0.9 + Math.random() * 0.25;
  sound.play();
}

function playErrorSound() {
  errorSound.pause();
  errorSound.currentTime = 0;
  errorSound.playbackRate = 0.95 + Math.random() * 0.1;
  errorSound.play();
}

document.addEventListener("keydown", (e) => {
  if (!audioUnlocked || gameIsOver) return;
  if (
    (e.code === "KeyA" ||
      e.code === "KeyD" ||
      e.code === "ArrowLeft" ||
      e.code === "ArrowRight") &&
    !walking
  ) {
    walking = true;
    walkSound.currentTime = 0;
    walkSound.play();
  }
  if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") {
    playJumpSound();
  }
});

document.addEventListener("keyup", (e) => {
  if (
    e.code === "KeyA" ||
    e.code === "KeyD" ||
    e.code === "ArrowLeft" ||
    e.code === "ArrowRight"
  ) {
    walking = false;
    walkSound.pause();
    walkSound.currentTime = 0;
  }
});

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyP" || e.code === "Escape") {
    if (!bgMusic.paused) {
      bgMusic.pause();
      walkSound.pause();
    } else {
      bgMusic.play();
    }
  }
});

function playGameOverMusic() {
  bgMusic.pause();
  bgMusic.currentTime = 0;
  walkSound.pause();
  walkSound.currentTime = 0;
  jumpSounds.forEach(({ sound }) => {
    sound.pause();
    sound.currentTime = 0;
  });
  gameOverSounds.forEach((sound) => {
    sound.pause();
    sound.currentTime = 0;
  });
  const randomSound =
    gameOverSounds[Math.floor(Math.random() * gameOverSounds.length)];
  randomSound.playbackRate = 0.9 + Math.random() * 0.2;
  randomSound.play();
}

window.addEventListener("game-over", () => {
  if (!audioUnlocked) return;
  gameIsOver = true;
  playGameOverMusic();
});

window.addEventListener("player-hit", () => {
  console.log("PLAYER HIT EVENT RECEIVED");
  if (!audioUnlocked || gameIsOver) return;
  playErrorSound();
});

const restartBtn = document.getElementById("restartBtn");

if (restartBtn) {
  restartBtn.addEventListener("click", () => {
    gameIsOver = false;
    gameOverSounds.forEach((sound) => {
      sound.pause();
      sound.currentTime = 0;
    });
    bgMusic.currentTime = 0;
    bgMusic.play();
  });
}
