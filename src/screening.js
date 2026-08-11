// The film in the About Me wing.
//
// Sitting in the chair doesn't open this straight away. The camera pans across
// to the screen first, the screen lights up, and only then does the video
// arrive — the pan is what makes it read as watching something in the room
// rather than as a modal appearing over a game.

import { ABOUT } from './data/projects.js';

let reelRoot, reelStage, reelCap, reelTitle, reelClose;
let reelOpen = false;
let reelOnClose = null;
let videoEl = null;

export function initScreening() {
  reelRoot = document.getElementById('screening');
  reelStage = document.getElementById('screening-stage');
  reelCap = document.getElementById('screening-caption');
  reelTitle = document.getElementById('screening-title');
  reelClose = document.getElementById('screening-close');

  reelClose.addEventListener('click', closeScreening);
  reelRoot.addEventListener('mousedown', (e) => {
    if (e.target === reelRoot) closeScreening();
  });
  reelRoot.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.code === 'KeyE') {
      e.preventDefault();
      e.stopPropagation();
      closeScreening();
    }
  });
}

export function isScreeningOpen() {
  return reelOpen;
}

export function openScreening(closedCallback) {
  reelOnClose = closedCallback || null;
  reelStage.innerHTML = '';

  reelTitle.textContent = ABOUT && ABOUT.name ? `${ABOUT.name} — now showing` : 'Now showing';
  reelCap.textContent = (ABOUT && ABOUT.videoCaption) || '';

  if (ABOUT && ABOUT.video) {
    videoEl = document.createElement('video');
    videoEl.src = ABOUT.video;
    if (ABOUT.videoPoster) videoEl.poster = ABOUT.videoPoster;
    videoEl.controls = true;
    videoEl.playsInline = true;
    videoEl.preload = 'metadata';
    reelStage.appendChild(videoEl);
    // autoplay is blocked without a gesture in most browsers; sitting down was
    // a gesture, so this usually works, and the controls are there when it
    // doesn't
    videoEl.play().catch(() => {});
  } else {
    videoEl = null;
    const note = document.createElement('div');
    note.className = 'reel-empty';
    // Whoever sits in this chair is a visitor, not whoever is building the
    // place. The instructions for putting a film in belong in the README.
    note.innerHTML =
      '<strong>NOTHING SHOWING</strong>'
      + 'No film yet. The chair is comfortable though, and the rest of the '
      + 'museum is back through the door behind you.';
    reelStage.appendChild(note);
  }

  reelOpen = true;
  reelRoot.hidden = false;
  requestAnimationFrame(() => reelRoot.classList.add('is-open'));
  reelClose.focus();
}

export function closeScreening() {
  if (!reelOpen) return;
  reelOpen = false;

  if (videoEl) {
    videoEl.pause();
    // drop the source too, so a large data URI isn't held in memory
    videoEl.removeAttribute('src');
    videoEl.load();
    videoEl = null;
  }

  reelRoot.classList.remove('is-open');
  setTimeout(() => {
    reelRoot.hidden = true;
    reelStage.innerHTML = '';
  }, 200);

  if (reelOnClose) reelOnClose();
}
