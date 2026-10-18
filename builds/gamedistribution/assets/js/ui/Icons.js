/**
 * Icons.js
 * Handcrafted vector SVG icons replacing generic emojis throughout the game.
 * Guarantees a polished, cohesive, professional travel-aesthetic UI.
 */

export const ICONS = {
  // Pause icon: two clean rounded pill bars
  pause: `
    <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <line x1="8" y1="5" x2="8" y2="19"></line>
      <line x1="16" y1="5" x2="16" y2="19"></line>
    </svg>
  `,

  // Play / Resume icon
  play: `
    <svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 4.5V19.5L19 12L7 4.5Z"/>
    </svg>
  `,

  // Mode Selector: Nautical Compass Rose
  compass: `
    <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fill-opacity="0.3"></polygon>
    </svg>
  `,

  // Passport booklet icon
  passport: `
    <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="3" fill="#1e3a8a" fill-opacity="0.15"></rect>
      <circle cx="12" cy="11" r="4.5" stroke="#d97706"></circle>
      <path d="M12 6.5V15.5M7.5 11H16.5" stroke="#d97706"></path>
      <path d="M8 18H16"></path>
    </svg>
  `,

  // Heart (Filled life)
  heartFilled: `
    <svg class="svg-heart filled" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ef4444" />
          <stop offset="100%" stop-color="#b91c1c" />
        </linearGradient>
      </defs>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#heartGrad)" />
    </svg>
  `,

  // Heart (Empty / Lost life)
  heartEmpty: `
    <svg class="svg-heart empty" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#cbd5e1" opacity="0.45" />
    </svg>
  `,

  // Origami paper airplane
  paperPlane: `
    <svg class="svg-icon plane-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 2L11 13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" fill-opacity="0.2" />
    </svg>
  `,

  // Sound ON
  soundOn: `
    <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fill-opacity="0.2"></polygon>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    </svg>
  `,

  // Sound OFF
  soundOff: `
    <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fill-opacity="0.2"></polygon>
      <line x1="23" y1="9" x2="17" y2="15"></line>
      <line x1="17" y1="9" x2="23" y2="15"></line>
    </svg>
  `,

  // Restart / Reload
  restart: `
    <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="1 4 1 10 7 10"></polyline>
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
    </svg>
  `,

  // Movie Clapper / Ad Icon for Rewarded Video (Clear 🎬 replacement, not green)
  clapper: `
    <svg class="svg-icon ad-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" fill="rgba(255,255,255,0.1)"></rect>
      <line x1="2" y1="10" x2="22" y2="10"></line>
      <line x1="7" y1="4" x2="5" y2="10"></line>
      <line x1="13" y1="4" x2="11" y2="10"></line>
      <line x1="19" y1="4" x2="17" y2="10"></line>
    </svg>
  `,

  // Trophy for Best Score
  trophy: `
    <svg class="svg-icon trophy-icon" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"></path>
      <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"></path>
      <path d="M4 3h16v6a8 8 0 0 1-16 0V3z" fill="#fef08a"></path>
      <path d="M12 17v4"></path>
      <path d="M8 21h8"></path>
    </svg>
  `,

  // Sleek Touch Gesture Indicator (Replaces yellow 👆 emoji)
  touchPointer: `
    <svg class="svg-touch-pointer" viewBox="0 0 48 48" fill="none">
      <circle class="touch-ring" cx="24" cy="24" r="16" stroke="#ffffff" stroke-width="2.5" opacity="0.6"/>
      <circle class="touch-dot" cx="24" cy="24" r="7" fill="#ffffff"/>
      <path d="M24 24L36 38" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `
};
