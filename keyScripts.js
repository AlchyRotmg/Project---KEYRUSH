const testArea = document.getElementById("test-area");
const userInput = document.getElementById("user-input");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const timerDisplay = document.getElementById("timer");
const results = document.getElementById("results");
const durationSelect = document.getElementById("test-duration");

let paragraphs = [];
let timer = null;
let timeLeft = 15;
let referenceText = "";
let started = false;
let incorrectKeystrokes = 0;
let startTime = null;

// Convert apostrophes to avoid mismatching which leads to incorrect keystrokes (' vs. ’)
function normalizeChar(c) {
  if (c === '’' || c === '‘') return "'";
  return c;
}

// Load paragraphs from the text file
async function loadParagraphs(filename) {
  try {
    const res = await fetch(filename);
    const text = await res.text();
    paragraphs = text
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0);
  } catch (err) {
    console.error("Failed to load paragraphs:", err);
  }
}

// Pick a random paragraph in the text file
function pickRandomParagraph() {
  const idx = Math.floor(Math.random() * paragraphs.length);
  referenceText = paragraphs[idx];
  testArea.textContent = referenceText;
}

async function startTest() {
  if (started) return;

  timeLeft = parseInt(durationSelect.value, 10);
  timerDisplay.textContent = timeLeft;

  // Load paragraphs file based on time drop down
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

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if (timeLeft <= 0) endTest();
  }, 1000);
}

// End the test and show results
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

// Highlight keystrokes
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

  // End the test if input matches the length of the paragraph
  if (input.length === referenceText.length) {
    endTest();
  }
}

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

startBtn.addEventListener("click", startTest);
resetBtn.addEventListener("click", resetTest);
userInput.addEventListener("input", () => {
  if (started) highlightInput();
});

userInput.disabled = true;
testArea.textContent = "Click 'Start Test' to begin...";
timerDisplay.textContent = durationSelect.value;

// Section for easter egg drag n drop

const keyrushKeys = document.querySelector(".keyrush-keys");
let draggedElement = null;
let easterEgg = null; // We'll create it dynamically

function showEasterEgg() {
  if (easterEgg) return; // Already shown

  easterEgg = document.createElement("div");
  easterEgg.id = "easter-egg-popup";
  Object.assign(easterEgg.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "#1d4ed8",
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
      background-color: rgb(26, 74, 176);
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

function enableDragDrop() {
  const keys = keyrushKeys.querySelectorAll(".key");
  keys.forEach(key => {
    key.setAttribute("draggable", "true");
    key.addEventListener("dragstart", handleDragStart);
    key.addEventListener("dragover", handleDragOver);
    key.addEventListener("dragend", handleDragEnd);
  });
}

function checkForEasterEgg() {
  const keys = keyrushKeys.querySelectorAll(".key");
  const currentSequence = Array.from(keys).map(k => k.textContent.trim()).join("");
  if (currentSequence.toUpperCase() === "RUSHKEY") {
    showEasterEgg();
  }
}

enableDragDrop();
