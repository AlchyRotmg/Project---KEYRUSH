// Getting all the main elements we need for the typing test
const testArea = document.getElementById("test-area"); 
const userInput = document.getElementById("user-input");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const timerDisplay = document.getElementById("timer");
const results = document.getElementById("results");
const durationSelect = document.getElementById("test-duration");

// Some variables for keeping track of game state
let paragraphs = [];
let timer = null;
let timeLeft = 15;
let referenceText = "";
let started = false;
let incorrectKeystrokes = 0;
let startTime = null;

// Helper to normalize weird apostrophes so they don't count as mistakes
function normalizeChar(c) {
  if (c === '’' || c === '‘') return "'";
  return c;
}

// Load a list of paragraphs from a file
async function loadParagraphs(filename) {
  try {
    const res = await fetch(filename);
    const text = await res.text();
    paragraphs = text
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0); // strip empty lines
  } catch (err) {
    console.error("Failed to load paragraphs:", err);
  }
}

// Get a random paragraph and show it on the screen
function pickRandomParagraph() {
  const idx = Math.floor(Math.random() * paragraphs.length);
  referenceText = paragraphs[idx];
  testArea.textContent = referenceText;
}

// Start the typing test timer and set everything up
async function startTest() {
  if (started) return;

  timeLeft = parseInt(durationSelect.value, 10);
  timerDisplay.textContent = timeLeft;

  // Load the correct file for 15s or 30s tests
  const filename = timeLeft === 15 ? "paragraphs15.txt" : "paragraphs30.txt";
  await loadParagraphs(filename);

  if (paragraphs.length === 0) {
    alert("Paragraphs not loaded yet. Please wait and try again.");
    return;
  }

  clearInterval(timer); 
  results.innerHTML = ""; 
  incorrectKeystrokes = 0;
  userInput.value = "";
  userInput.disabled = false;
  userInput.focus();

  started = true;
  startTime = new Date();
  pickRandomParagraph();

  // Start the countdown timer
  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if (timeLeft <= 0) endTest();
  }, 1000);
}

// End the test, calculate results like WPM and accuracy
function endTest() {
  clearInterval(timer); 
  started = false;
  userInput.disabled = true;

  const typed = userInput.value;
  const wordsTyped = typed.trim().split(/\s+/).filter(Boolean).length;
  const elapsedSeconds = parseInt(durationSelect.value, 10) - timeLeft;
  const wpm = elapsedSeconds > 0 ? Math.round((wordsTyped / elapsedSeconds) * 60) : 0;

  let correct = 0;
  incorrectKeystrokes = 0;

  const minLen = Math.min(typed.length, referenceText.length);

  for (let i = 0; i < minLen; i++) {
    if (normalizeChar(typed[i]) === normalizeChar(referenceText[i])) {
      correct++;
    } else {
      incorrectKeystrokes++;
    }
  }

  // Account for extra or missing chars
  if (typed.length > referenceText.length) {
    incorrectKeystrokes += typed.length - referenceText.length;
  }

  if (typed.length < referenceText.length) {
    incorrectKeystrokes += referenceText.length - typed.length;
  }

  const accuracy = Math.round((correct / referenceText.length) * 100);

  results.innerHTML = `
    🕒 Time Taken: <strong>${elapsedSeconds}s</strong><br>
    🔤 WPM: <strong>${wpm}</strong><br>
    ✅ Accuracy: <strong>${accuracy}%</strong><br>
    ❌ Incorrect Keystrokes: <strong>${incorrectKeystrokes}</strong>
  `;
  results.classList.remove("hidden");
}

// Highlight the correct and incorrect chars as you type
function highlightInput() {
  const input = userInput.value;
  let html = "";

  for (let i = 0; i < referenceText.length; i++) {
    const char = referenceText[i];
    const typedChar = input[i];

    if (typedChar == null) {
      html += `<span>${char}</span>`;
    } else if (normalizeChar(typedChar) === normalizeChar(char)) {
      html += `<span class="correct">${char}</span>`;
    } else {
      html += `<span class="incorrect">${char}</span>`;
    }
  }

  testArea.innerHTML = html;

  // End the test if the entire text was typed
  if (input.length === referenceText.length) {
    endTest();
  }
}

// Reset the test back to the beginning
function resetTest() {
  clearInterval(timer); 
  timeLeft = parseInt(durationSelect.value, 10); 
  timerDisplay.textContent = timeLeft;
  started = false;
  userInput.disabled = true;
  userInput.value = "";
  results.innerHTML = "";
  testArea.textContent = "Click 'Start Test' to begin...";
}

// Wire up all the button and input events
startBtn.addEventListener("click", startTest);
resetBtn.addEventListener("click", resetTest);
userInput.addEventListener("input", () => {
  if (started) highlightInput();
});

userInput.disabled = true;
testArea.textContent = "Click 'Start Test' to begin...";
timerDisplay.textContent = durationSelect.value;

// ========== Drag and drop secret easter egg section ==========

// Grab the keys container and some state vars
const keyrushKeys = document.querySelector(".keyrush-keys");
let draggedElement = null;
let easterEgg = null; 

// Show the RUSHKEY easter egg popup
function showEasterEgg() {
  if (easterEgg) return; 

  easterEgg = document.createElement("div");
  easterEgg.id = "easter-egg-popup";
  Object.assign(easterEgg.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "#13171F",
    color: "#ffffff",
    border: "2px solid #1e40af",
    padding: "20px",
    zIndex: "9999",
    boxShadow: "0 0 15px rgba(29, 78, 216, 0.7)",
    minWidth: "250px",
    textAlign: "center",
    borderRadius: "12px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  });

  easterEgg.innerHTML = `
    <h2 style="margin-top: 0; margin-bottom: 10px;">🎉 Easter Egg Found! 🎉</h2>
    <p>You discovered the secret word: <strong>RUSHKEY</strong>!</p>
    <div style="margin: 15px 0;">
      <img id="easter-egg-gif" src="https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif" alt="Easter Egg GIF" style="max-width: 100%; border-radius: 8px;" />
    </div>
    <button id="close-easter-egg" style="
      background-color:rgb(37, 47, 67);
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 1rem;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    ">Close</button>
  `;

  document.body.appendChild(easterEgg);

  const closeBtn = document.getElementById("close-easter-egg");
  closeBtn.addEventListener("click", () => {
    if (easterEgg) {
      easterEgg.remove();
      easterEgg = null;
    }
  });
}

// Drag event handlers for the keys
function handleDragStart(e) {
  draggedElement = e.target;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/html", e.target.outerHTML);
  e.target.classList.add("dragging");
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";

  const target = e.target;
  if (!target.classList.contains("key") || target === draggedElement) return;

  const rect = target.getBoundingClientRect();
  const halfway = rect.left + rect.width / 2;
  if (e.clientX < halfway) {
    keyrushKeys.insertBefore(draggedElement, target);
  } else {
    keyrushKeys.insertBefore(draggedElement, target.nextSibling);
  }
}

function handleDragEnd(e) {
  e.target.classList.remove("dragging");
  draggedElement = null;
  checkForEasterEgg();
}

// Make all the keys draggable
function enableDragDrop() {
  const keys = keyrushKeys.querySelectorAll(".key");
  keys.forEach(key => {
    key.setAttribute("draggable", "true");
    key.addEventListener("dragstart", handleDragStart);
    key.addEventListener("dragover", handleDragOver);
    key.addEventListener("dragend", handleDragEnd);
  });
}

// Check if the keys spell "RUSHKEY"
function checkForEasterEgg() {
  const keys = keyrushKeys.querySelectorAll(".key");
  const currentSequence = Array.from(keys).map(k => k.textContent.trim()).join("");
  if (currentSequence.toUpperCase() === "RUSHKEY") {
    showEasterEgg();
  }
}

enableDragDrop();

// Change the footer text on hover just for fun
const footerText = document.querySelector('footer.container.contrast > div:nth-child(2)');
const originalText = footerText.textContent;
const hoverText = originalText.replace('KEYRUSH', 'RUSHKEY');

footerText.addEventListener('mouseenter', () => {
  footerText.textContent = hoverText;
  footerText.setAttribute('title', '???');  
});

footerText.addEventListener('mouseleave', () => {
  footerText.textContent = originalText;
  footerText.removeAttribute('title');      
});

// ========== Theme menu stuff ==========

const settingsToggle = document.getElementById('settings-toggle');
const settingsMenu = document.getElementById('settings-menu');
const themeForm = document.getElementById('theme-form');

let memeContainer;
let animationId;
let memesData = [];

// Toggle the settings menu open/closed
settingsToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  settingsMenu.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
  if (!settingsMenu.contains(e.target) && !settingsToggle.contains(e.target)) {
    settingsMenu.classList.add('hidden');
  }
});

// Clear all floating memes if meme mode is off
function clearMemes() {
  if (memeContainer) {
    memeContainer.remove();
    memeContainer = null;
  }
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  memesData = [];
}

// Start up the goofy meme mode background and floating memes
function startMemeMode() {
  document.body.style.backgroundImage = "url('https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExODg1YjJsZXRsanBuNnhna3I4bGJ3YjZndXpxNWE3M241dGUwZ2NycyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Vuw9m5wXviFIQ/giphy.gif')";
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundRepeat = 'no-repeat';
  document.body.style.backgroundPosition = 'center';

  memeContainer = document.createElement('div');
  memeContainer.id = 'meme-container';
  document.body.appendChild(memeContainer);

  const memes = [
    'https://alchyrotmg.github.io/Project---KEYRUSH/images/image1.png',
    'https://alchyrotmg.github.io/Project---KEYRUSH/images/image2.png',
    'https://alchyrotmg.github.io/Project---KEYRUSH/images/image3.png',
    'https://alchyrotmg.github.io/Project---KEYRUSH/images/image4.png',
    'https://alchyrotmg.github.io/Project---KEYRUSH/images/image5.png',
    'https://alchyrotmg.github.io/Project---KEYRUSH/images/image6.png',
    'https://alchyrotmg.github.io/Project---KEYRUSH/images/image7.png',
    'https://alchyrotmg.github.io/Project---KEYRUSH/images/image8.png',
    'https://alchyrotmg.github.io/Project---KEYRUSH/images/image9.png',
    'https://alchyrotmg.github.io/Project---KEYRUSH/images/image10.png',
  ];

  const shuffledMemes = memes.sort(() => Math.random() - 0.5).slice(0, 10);
  memesData = [];

  // Make 10 floating meme images that bounce around and can be dragged
  for (let i = 0; i < 10; i++) {
    const img = document.createElement('img');
    img.src = shuffledMemes[i];
    img.classList.add('floating-meme');

    const posX = Math.random() * (window.innerWidth - 80);
    const posY = Math.random() * (window.innerHeight - 80);

    img.style.left = `${posX}px`;
    img.style.top = `${posY}px`;

    memeContainer.appendChild(img);

    const velocityX = (Math.random() * 2 + 1.5) * (Math.random() < 0.5 ? 1 : -1);
    const velocityY = (Math.random() * 2 + 1.5) * (Math.random() < 0.5 ? 1 : -1);

    const meme = {
      img,
      posX,
      posY,
      velocityX,
      velocityY,
      isDragging: false,
      offsetX: 0,
      offsetY: 0
    };

    img.addEventListener('mousedown', (e) => {
      meme.isDragging = true;
      meme.offsetX = e.clientX - meme.posX;
      meme.offsetY = e.clientY - meme.posY;
      e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
      meme.isDragging = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (meme.isDragging) {
        meme.posX = e.clientX - meme.offsetX;
        meme.posY = e.clientY - meme.offsetY;
        meme.img.style.left = `${meme.posX}px`;
        meme.img.style.top = `${meme.posY}px`;
      }
    });

    memesData.push(meme);
  }

  // Make all memes bounce around the screen
  function animate() {
    memesData.forEach((meme) => {
      if (!meme.isDragging) {
        meme.posX += meme.velocityX;
        meme.posY += meme.velocityY;

        if (meme.posX <= 0 || meme.posX + 80 >= window.innerWidth) {
          meme.velocityX *= -1;
          meme.posX = Math.max(0, Math.min(meme.posX, window.innerWidth - 80));
        }

        if (meme.posY <= 0 || meme.posY + 80 >= window.innerHeight) {
          meme.velocityY *= -1;
          meme.posY = Math.max(0, Math.min(meme.posY, window.innerHeight - 80));
        }

        meme.img.style.left = `${meme.posX}px`;
        meme.img.style.top = `${meme.posY}px`;
      }
    });

    animationId = requestAnimationFrame(animate);
  }

  animate();
}

// Change theme based on radio inputs
themeForm.addEventListener('change', (e) => {
  if (e.target.name === 'theme') {
    document.body.classList.remove('light-mode', 'dark-mode', 'default-mode', 'meme-mode');
    clearMemes();
    document.body.style.backgroundImage = '';

    switch (e.target.value) {
      case 'light':
        document.body.classList.add('light-mode');
        break;
      case 'meme':
        document.body.classList.add('meme-mode');
        startMemeMode();
        break;
      case 'default':
        document.body.classList.add('default-mode');
        break;
    }
  }
});

// On page load, use the default theme
window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('default-mode');
});
