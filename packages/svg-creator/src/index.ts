import type { PacmanGrid, Direction } from "@git-pacman/grid";

// ─── Layout ──────────────────────────────────────────────────────────────────
const CELL_SIZE = 14;
const CELL_GAP = 2;
const PADDING = 20;
const STEP_DURATION = 0.08; // seconds per path step

// ─── Direction → rotation angle (Pac-Man faces right at 0°) ─────────────────
const DIR_ANGLE: Record<Direction, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
};

// ─── Cell renderers ───────────────────────────────────────────────────────────
// SPRITE: replace rect/circle shapes with custom artwork. Canvas is 14×14px.

function renderWall(x: number, y: number): string {
  // Blue-outlined rect — classic Pac-Man maze wall look
  return `<rect x="${x + 1}" y="${y + 1}" width="12" height="12" rx="1.5"
    fill="#0f1b3d" stroke="#3b82f6" stroke-width="1.5"/>`;
}

function renderFloor(x: number, y: number): string {
  return `<rect x="${x + 2}" y="${y + 2}" width="10" height="10" rx="2" fill="#161b22"/>`;
}

function renderDot(x: number, y: number, opacityAnim: string): string {
  // SPRITE: yellow pellet dot — replace circle with custom artwork
  return `<circle cx="${x + 7}" cy="${y + 7}" r="3.5" fill="#FFD700">${opacityAnim}</circle>`;
}

function renderCherry(x: number, y: number, opacityAnim: string): string {
  // SPRITE: pixel-art cherry — traced from assets/pacman-kit/sprites/cherry.svg (14×14 canvas).
  // opacityAnim is a complete <animate> element placed inside the <g> to fade
  // the whole cherry out when Pac-Man eats it.
  const t = (dx: number, dy: number, w: number, h: number, fill: string) =>
    `<rect x="${x + dx}" y="${y + dy}" width="${w}" height="${h}" fill="${fill}"/>`;
  return `<g>
    ${opacityAnim}
    ${t(6, 0, 2, 1, "#3a7d44")}
    ${t(5, 1, 1, 1, "#3a7d44")}${t(8, 1, 1, 1, "#3a7d44")}
    ${t(4, 2, 1, 1, "#3a7d44")}${t(9, 2, 1, 1, "#3a7d44")}
    ${t(3, 3, 1, 1, "#3a7d44")}${t(10, 3, 1, 1, "#3a7d44")}
    ${t(2, 4, 3, 1, "#cc1100")}${t(9, 4, 3, 1, "#cc1100")}
    ${t(1, 5, 5, 3, "#cc1100")}${t(8, 5, 5, 3, "#cc1100")}
    ${t(2, 8, 3, 1, "#cc1100")}${t(9, 8, 3, 1, "#cc1100")}
    ${t(2, 5, 1, 1, "#ff5555")}${t(9, 5, 1, 1, "#ff5555")}
  </g>`;
}

// ─── Character renderers ──────────────────────────────────────────────────────
// Each character uses nested <g> elements:
//   outer <g>: animateTransform translate → moves to grid position
//   inner <g>: animateTransform rotate   → faces movement direction
//
// SPRITE: replace shape elements inside inner <g> with custom artwork (14×14 canvas,
// character should face RIGHT at 0°, centered at (7,7)).

function renderPacman(
  translateValues: string,
  rotateValues: string, // unused; dog stays upright & faces right
  keyTimes: string,
  dur: number
): string {
  // SPRITE: sausage dog — friend's doggie-kit art, scaled into the 14px cell via nested viewBox.
  const dog = `
    <svg x="0" y="2" width="14" height="10" viewBox="33 19 185 102" preserveAspectRatio="xMidYMid meet">
      <path d="M0 0 C14.52 0 29.04 0 44 0 C46 4 46 4 46 8 C48.31 8 50.62 8 53 8 C53 10.31 53 12.62 53 15 C54.89599609 14.98413086 54.89599609 14.98413086 63.375 14.9375 C64.85226563 14.92493164 64.85226563 14.92493164 66.359375 14.91210938 C67.77089844 14.90727539 67.77089844 14.90727539 69.2109375 14.90234375 C71.84521484 14.88647461 71.84521484 14.88647461 74 15 C76 16 76 16 76 38 C73.69 38.66 71.38 39.32 69 40 C68.67 41.98 68.34 43.96 68 46 C64.535 46.495 64.535 46.495 61 47 C60.67 49.31 60.34 51.62 60 54 C52.74 54 45.48 54 38 54 C38 61.59 38 69.18 38 77 C34.69 77 32.38 77 30 77 C30 81.95 30 86.9 30 92 C27.69 92 25.38 92 23 92 C23 94.31 23 96.62 23 99 C21 100 21 100 17.99609375 100.23046875 C12.67212891 100.17783203 12.67212891 100.17783203 7 99 C7 94 7 89 7 84 C4.03 84.495 4.03 84.495 1 85 C0.34 87.31 -0.32 89.62 -1 92 C-2.98 92 -4.96 92 -7 92 C-7.33 94.31 -7.66 96.62 -8 99 C-9 100 -9 100 -15.5 100.125 C-22 100 -22 100 -23 99 C-23 94 -23 89 -23 84 C-44.35537826 86.00593433 -44.35537826 86.00593433 -53 84 C-53 86.31 -53 88.62 -53 91 C-56.375 91.5625 -56.375 91.5625 -60 93 C-61.54086322 96.51400668 -61.54086322 96.51400668 -62 100 C-64.14576637 100.02685938 -66.29162645 100.04633088 -68.4375 100.0625 C-75 100 -75 100 -76 99 C-76.5625 91.9375 -76.5625 91.9375 -77 85 C-79.97 84.505 -79.97 84.505 -83 84 C-83 90 -83 90 -84 92 C-87.0625 92.625 -87.0625 92.625 -90 93 C-91 99 -91 99 -91 99 C-93.88415883 100.44207941 -96.41721528 100.09394887 -99.625 100.0625 C-106 100 -106 100 -107 100 C-107 90 -107 80 -107 69 C-109.97 69.495 -109.97 69.495 -113 70 C-113.33 72.31 -113.66 74.62 -114 77 C-116.31 77 -118.62 77 -121 77 C-121 79 -121 81 -121 83 C-124.5 85.33 -124.5 85.33 -130.125 85.1875 C-136 85 -136 85 -137 84 C-137 79 -137 74 -137 69 C-133.535 68.505 -133.535 68.505 -130 68 C-129.67 63.38 -129.34 58.76 -129 54 C-126 53 -126 53 -123 53 C-122.34 50.69 -121.68 48.38 -121 46 C-118.69 46 -116.38 46 -114 46 C-114 43 -114 40 -113 38 C-110.64686445 37.92728259 -108.29 37.91 -99 38 C-99 35.69 -99 33.38 -99 31 C-71.61 30.67 -44.22 30.34 -16 30 C-16 25.71 -16 21.42 -16 17 C-10 15 -10 15 -8 15 C-8 12.69 -8 10.38 -8 8 C-5.69 8 -3.38 8 -1 8 C-0.67 5.36 -0.34 2.72 0 0 Z " fill="#853F37" transform="translate(140,19)"/>
      <path d="M0 0 C4.95 0 9.9 0 15 0 C15 14.52 15 29.04 15 44 C10.05 44 5.1 44 0 44 C-0.33 42.02 -0.66 40.04 -1 38 C-3.31 37.67 -5.62 37.34 -8 37 C-8 27.1 -8 17.2 -8 7 C-5.36 7 -2.72 7 0 7 C0 4.69 0 2.38 0 0 Z " fill="#C5743F" transform="translate(140,28)"/>
      <path d="M0 0 C10.05 -0.09 10.05 -0.09 13 0 C14 1 14 1 14 7 C16.97 7 19.94 7 23 7 C23 9.64 23 12.28 23 15 C25.31 15 27.62 15 30 15 C30 17.64 30 20.28 30 23 C27.03 23 24.06 23 21 23 C21 25.31 21 27.62 21 30 C11.43 30 1.86 30 -8 30 C-8 25.38 -8 20.76 -8 16 C-4.535 15.505 -4.535 15.505 -1 15 C-0.67 10.05 -0.34 5.1 0 0 Z " fill="#C2723F" transform="translate(178,35)"/>
      <path d="M0 0 C4.62 0 9.24 0 14 0 C14 2.31 14 4.62 14 7 C11.69 7.33 9.38 7.66 7 8 C7 10.31 7 12.62 7 15 C4.69 15 2.38 15 0 15 C0 10.05 0 5.1 0 0 Z " fill="#BD7041" transform="translate(125,95)"/>
      <path d="M0 0 C4.62 0 9.24 0 14 0 C14 1.98 14 3.96 14 6 C11.69 6 9.38 6 7 6 C7 8.64 7 11.28 7 14 C4.69 14 2.38 14 0 14 C0 9.38 0 4.76 0 0 Z " fill="#C3723F" transform="translate(42,96)"/>
      <path d="M0 0 C1.98 0 3.96 0 6 0 C6 3.63 6 7.26 6 11 C4.35 11.33 2.7 11.66 1 12 C0.67 8.04 0.34 4.08 0 0 Z " fill="#863F36" transform="translate(72,97)"/>
      <circle cx="205" cy="48" r="4" fill="#1a1a1a"/>
    </svg>`;
  return `
  <g>
    <animateTransform attributeName="transform" type="translate"
      values="${translateValues}" keyTimes="${keyTimes}"
      dur="${dur}s" repeatCount="indefinite" calcMode="discrete"/>
    ${dog}
  </g>`;
}
// Pupil x-positions per direction.
// Left eye white: x=2..4. Right eye white: x=8..10.
// Pupil is 1×2; right-facing → right side of eye; left-facing → left side.
const PUPIL_X: Record<Direction, { left: number; right: number }> = {
  right: { left: 4, right: 10 },
  left:  { left: 2, right: 8  },
  up:    { left: 4, right: 10 }, // treat up/down as right-facing
  down:  { left: 2, right: 8  }, // treat down as left-facing
};

function renderGhost(
  color: string,
  translateValues: string,
  leftPupilX: string,   // per-frame x for left-eye pupil
  rightPupilX: string,  // per-frame x for right-eye pupil
  keyTimes: string,
  dur: number
): string {
  // SPRITE: pixel-art ghost traced from ghost_right.jpeg (14×14 canvas).
  // Replace rect/circle shapes with custom artwork to reskin.
  return `
  <g>
    <animateTransform attributeName="transform" type="translate"
      values="${translateValues}" keyTimes="${keyTimes}"
      dur="${dur}s" repeatCount="indefinite" calcMode="discrete"/>
    <!-- Top dome -->
    <rect x="4"  y="0" width="6"  height="1" fill="${color}"/>
    <rect x="3"  y="1" width="8"  height="1" fill="${color}"/>
    <rect x="2"  y="2" width="10" height="1" fill="${color}"/>
    <rect x="1"  y="3" width="12" height="1" fill="${color}"/>
    <!-- Eye-row body (left edge, centre, right edge) -->
    <rect x="1"  y="4" width="1"  height="4" fill="${color}"/>
    <rect x="5"  y="4" width="3"  height="4" fill="${color}"/>
    <rect x="11" y="4" width="2"  height="4" fill="${color}"/>
    <!-- Main body rows 8-10 -->
    <rect x="1"  y="8" width="12" height="3" fill="${color}"/>
    <!-- Skirt: 3 feet bases (row 11) -->
    <rect x="1"  y="11" width="3" height="1" fill="${color}"/>
    <rect x="5"  y="11" width="3" height="1" fill="${color}"/>
    <rect x="9"  y="11" width="3" height="1" fill="${color}"/>
    <!-- Skirt: 3 feet tips (row 12) -->
    <rect x="1"  y="12" width="2" height="1" fill="${color}"/>
    <rect x="5"  y="12" width="2" height="1" fill="${color}"/>
    <rect x="9"  y="12" width="2" height="1" fill="${color}"/>
    <!-- Left eye white -->
    <rect x="2" y="4" width="3" height="4" fill="white"/>
    <!-- Left pupil — animates x between 2 (left-facing) and 4 (right-facing) -->
    <rect y="6" width="1" height="2" fill="#1a1a1a">
      <animate attributeName="x" values="${leftPupilX}"
        keyTimes="${keyTimes}" dur="${dur}s" repeatCount="indefinite" calcMode="discrete"/>
    </rect>
    <!-- Right eye white -->
    <rect x="8" y="4" width="3" height="4" fill="white"/>
    <!-- Right pupil — animates x between 8 (left-facing) and 10 (right-facing) -->
    <rect y="6" width="1" height="2" fill="#1a1a1a">
      <animate attributeName="x" values="${rightPupilX}"
        keyTimes="${keyTimes}" dur="${dur}s" repeatCount="indefinite" calcMode="discrete"/>
    </rect>
  </g>`;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export interface SvgOptions {
  includeGhosts?: boolean;
  colorScheme?: "dark" | "light";
}

export function createSvg(grid: PacmanGrid, options: SvgOptions = {}): string {
  const { includeGhosts = true, colorScheme = "dark" } = options;

  const step = CELL_SIZE + CELL_GAP;
  const width = grid.cols * step + PADDING * 2;
  const height = grid.rows * step + PADDING * 2;
  const bg = colorScheme === "dark" ? "#0d1117" : "#ffffff";

  const n = grid.path.length;
  if (n === 0) return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${bg}"/></svg>`;

  const totalDuration = n * STEP_DURATION;

  // Shared keyTimes string — same for Pac-Man AND all ghosts
  const keyTimes = grid.path
    .map((_, i) => (n === 1 ? "0" : (i / (n - 1)).toFixed(4)))
    .join(";");

  // ── Eat-time lookup: "col,row" → step index ──
  const eatTime = new Map<string, number>();
  grid.path.forEach((s, i) => {
    if (s.eating) eatTime.set(`${s.col},${s.row}`, i);
  });

  // ── All 52×7 cells ──
  const wallCells: string[] = [];
  const floorCells: string[] = [];
  const dotCells: string[] = [];

  for (let c = 0; c < grid.cols; c++) {
    for (let r = 0; r < grid.rows; r++) {
      const cell = grid.cells[c][r];
      const x = PADDING + c * step;
      const y = PADDING + r * step;

      if (cell.cellType === "wall") {
        wallCells.push(renderWall(x, y));
      } else if (cell.cellType === "floor") {
        floorCells.push(renderFloor(x, y));
      } else {
        // active dot or cherry — disappears when Pac-Man arrives
        const arrival = eatTime.get(`${c},${r}`);
        let opacityAnim = "";
        if (arrival !== undefined) {
          const t0 = Math.max(0.0001, arrival / Math.max(1, n - 1));
          const t1 = Math.min(t0 + 0.005, 0.9999);
          opacityAnim = `<animate attributeName="opacity" values="1;1;0;0"
            keyTimes="0;${t0.toFixed(4)};${t1.toFixed(4)};1"
            dur="${totalDuration}s" repeatCount="indefinite"/>`;
        }
        if (cell.cellType === "cherry") {
          dotCells.push(renderCherry(x, y, opacityAnim));
        } else {
          dotCells.push(renderDot(x, y, opacityAnim));
        }
      }
    }
  }

  // ── Pac-Man ──
  const pacTranslate = grid.path
    .map((s) => `${PADDING + s.col * step},${PADDING + s.row * step}`)
    .join(";");
  const pacRotate = grid.path
    .map((s) => `${DIR_ANGLE[s.direction]},7,7`)
    .join(";");

  const pacman = renderPacman(pacTranslate, pacRotate, keyTimes, totalDuration);

  // ── Ghosts — snake chain: ghost k is always exactly `offset` steps behind Pac-Man ──
  // Colors match the user's four ghost variants: red, pink, yellow, neon blue
  const GHOST_COLORS = ["#FF0000", "#FFB8FF", "#FFD700", "#29ABE2"];
  const GHOST_OFFSETS = [4, 8, 12, 16];

  let ghosts = "";
  if (includeGhosts) {
    ghosts = GHOST_COLORS.map((color, gi) => {
      const offset = GHOST_OFFSETS[gi];

      // At step i this ghost occupies path[max(0, i - offset)]
      const src = (i: number) => grid.path[Math.max(0, i - offset)];

      const translateValues = grid.path
        .map((_, i) => `${PADDING + src(i).col * step},${PADDING + src(i).row * step}`)
        .join(";");

      // Pupil x positions update with the ghost's own movement direction
      const leftPupilX = grid.path
        .map((_, i) => PUPIL_X[src(i).direction].left)
        .join(";");
      const rightPupilX = grid.path
        .map((_, i) => PUPIL_X[src(i).direction].right)
        .join(";");

      return renderGhost(color, translateValues, leftPupilX, rightPupilX, keyTimes, totalDuration);
    }).join("\n");
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <title>GitHub Contributions — Pac-Man</title>
  <rect width="${width}" height="${height}" fill="${bg}" rx="6"/>

  <!-- Walls (inactive, no active neighbors) -->
  ${wallCells.join("\n  ")}

  <!-- Floor / corridors (inactive, adjacent to active) -->
  ${floorCells.join("\n  ")}

  <!-- Active dots (disappear as Pac-Man eats them) -->
  ${dotCells.join("\n  ")}

  <!-- Ghosts — trailing Pac-Man at fixed offsets (snake chain, no growth) -->
  ${ghosts}

  <!-- Pac-Man -->
  ${pacman}
</svg>`;
}
