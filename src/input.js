// Keyboard handling. Arrow keys and WASD both move; E, Enter and Space all
// interact, because nobody should have to guess.

const down = new Set();
const pressedThisFrame = new Set();

const MOVE = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

const SWALLOW = new Set([
  ...Object.keys(MOVE), 'Space', 'Enter', 'KeyE', 'Escape',
]);

// Keys that activate whatever has focus, and the things they activate.
const ACTIVATORS = new Set(['Enter', 'Space']);
const CONTROL = 'a[href], button, input, select, textarea, [contenteditable]';

let anyKeyListeners = [];

export function initInput() {
  window.addEventListener('keydown', (e) => {
    // let the browser have its shortcuts back
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // And let a focused control have the keys that activate it. Enter and Space
    // are swallowed so they don't re-trigger whatever the droid is standing at,
    // but taking them off a button or a link means every arrow, dot and tab in
    // an open panel can be reached by keyboard and then not used. The droid
    // isn't going anywhere while a panel is up.
    if (ACTIVATORS.has(e.code) && e.target.closest && e.target.closest(CONTROL)) {
      return;
    }
    if (SWALLOW.has(e.code)) e.preventDefault();
    if (!down.has(e.code)) pressedThisFrame.add(e.code);
    down.add(e.code);
    anyKeyListeners.forEach((fn) => fn(e));
  });

  window.addEventListener('keyup', (e) => down.delete(e.code));

  // don't let keys stick when the tab loses focus mid-walk
  window.addEventListener('blur', () => down.clear());
}

/** Fires on the next keydown, then unsubscribes itself. */
export function onceAnyKey(fn) {
  const wrapped = (e) => {
    anyKeyListeners = anyKeyListeners.filter((f) => f !== wrapped);
    fn(e);
  };
  anyKeyListeners.push(wrapped);
  return () => { anyKeyListeners = anyKeyListeners.filter((f) => f !== wrapped); };
}

export function isDown(code) {
  return down.has(code);
}

export function wasPressed(code) {
  return pressedThisFrame.has(code);
}

let pointerFlag = false;

/** Treat a click on the canvas like a keypress, for the title screen. */
export function watchPointer(el) {
  el.addEventListener('pointerdown', () => { pointerFlag = true; });
}

/** True if anything at all was pressed or clicked this frame. */
export function anyPressed() {
  return pressedThisFrame.size > 0 || pointerFlag;
}

/** Normalised movement vector for this frame. */
export function moveAxis() {
  let x = 0;
  let y = 0;
  for (const [code, dir] of Object.entries(MOVE)) {
    if (!down.has(code)) continue;
    if (dir === 'up') y -= 1;
    if (dir === 'down') y += 1;
    if (dir === 'left') x -= 1;
    if (dir === 'right') x += 1;
  }
  x = Math.max(-1, Math.min(1, x));
  y = Math.max(-1, Math.min(1, y));
  if (x && y) {
    const inv = Math.SQRT1_2;
    return { x: x * inv, y: y * inv };
  }
  return { x, y };
}

export function interactPressed() {
  return pressedThisFrame.has('KeyE')
    || pressedThisFrame.has('Enter')
    || pressedThisFrame.has('Space');
}

/** Called at the end of every frame by the main loop. */
export function endFrame() {
  pressedThisFrame.clear();
  pointerFlag = false;
}

export function clearHeldKeys() {
  down.clear();
  pressedThisFrame.clear();
}
