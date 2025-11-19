// The following code is a fix for the calculator functionality.
// It addresses bugs related to button actions and improves the evaluation logic.

// Selecting the display and all buttons from the DOM
const display = document.getElementById('display');
const buttons = Array.from(document.querySelectorAll('.btn'));
const themeToggle = document.getElementById('themeToggle');
const soundToggle = document.getElementById('soundToggle');

// Lazy AudioContext and short click sound using Web Audio API
let audioCtx;
// Mute flag (persisted) and click sound using Web Audio API
let isMuted = localStorage.getItem('calcMuted') === 'true';
function updateSoundButton() {
    if (!soundToggle) return;
    soundToggle.textContent = isMuted ? '🔇' : '🔊';
    soundToggle.title = isMuted ? 'Unmute' : 'Mute';
}

function playClickSound() {
    if (isMuted) return;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, now);

        // tiny envelope for a click
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.13);
    } catch (err) {
        // If audio is blocked/unavailable, fail silently
    }
}

// Initialize sound button state
updateSoundButton();

if (soundToggle) {
    soundToggle.addEventListener('click', () => {
        isMuted = !isMuted;
        localStorage.setItem('calcMuted', isMuted);
        updateSoundButton();
        if (!isMuted) playClickSound();
    });
}

/**
 * Event listener for button clicks.
 * Handles the calculator logic based on the button pressed.
 */
buttons.forEach(button => {
    button.addEventListener('click', (e) => {
        // Play click sound for any button press (mouse or dispatched click)
        playClickSound();
        const target = e.currentTarget;
        const action = target.dataset.action;

        if (action === 'clear') {
            // Clear the display if the 'clear' button is pressed
            display.value = '';
        } else if (action === 'equals') {
            // If display is empty, do nothing
            if (display.value === "") {
                return;
            }
            try {
                // Replace display characters with code-friendly operators for evaluation
                let expression = display.value.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
                // Use the Function constructor for safer evaluation
                const result = new Function('return ' + expression)();
                display.value = result;
            } catch (error) {
                // Display an error message if the expression is invalid
                display.value = "Error";
            }
        } else {
            // For all other buttons, append their visible text to the display
            display.value += target.innerText;
        }
    });
});

/**
 * Event listener for the theme toggle button.
 * Toggles between light and dark themes.
 */
themeToggle.addEventListener('click', () => {
    // theme toggle is also a button — play a sound
    playClickSound();
    // Toggle the 'data-theme' attribute on the root element
    if (document.documentElement.hasAttribute('data-theme')) {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
});

/**
 * Event listener for keyboard input.
 * Allows the use of the calculator with a physical keyboard.
 */
document.addEventListener('keydown', (e) => {
    const key = e.key;
    let buttonToClick = null;

    if (key === 'Enter') {
        e.preventDefault(); 
        buttonToClick = buttons.find(btn => btn.dataset.action === 'equals');
    } else if (key.toLowerCase() === 'c' || key === 'Escape') {
        buttonToClick = buttons.find(btn => btn.dataset.action === 'clear');
    } else if (key === 'Backspace') {
        display.value = display.value.slice(0, -1);
        // Play click on Backspace key
        playClickSound();
    } else {
        // Map keyboard keys to button text content
        const keyMap = {
            '/': '÷',
            '*': '×',
            '-': '−',
            '+': '+'
        };
        const buttonText = keyMap[key] || key;
        buttonToClick = buttons.find(btn => btn.innerText === buttonText);
    }

    if (buttonToClick) {
        buttonToClick.click();
    }
});