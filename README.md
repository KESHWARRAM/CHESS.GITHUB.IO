# Professional Chess Game

A fully functional, browser-based chess game with AI opponents at three difficulty levels (Easy, Medium, Hard). Built with vanilla JavaScript and strict FIDE chess rule enforcement.

## Features

- **Player vs Computer Gameplay** — Challenge AI at three skill levels
- **100% Legal Chess** — All official FIDE rules enforced
- **Three AI Difficulty Levels**
  - Easy: Random move selection
  - Medium: Minimax (depth 2–3) with basic evaluation
  - Hard: Minimax + Alpha-Beta Pruning with advanced evaluation
- **Complete Rule Support**
  - Pawn promotion with piece selection
  - Castling (kingside & queenside)
  - En passant captures
  - Check & checkmate detection
  - Stalemate detection
  - Insufficient material draw
- **Responsive Design** — Fully playable on mobile, tablet, and desktop
- **Progressive Web App** — Installable and offline-capable
- **Professional UI** — Dark theme with smooth animations and visual feedback

## Project Structure

```
chess-game/
├── index.html              Main game interface
├── rules.html              Chess rules, controls & help
├── manifest.json           PWA manifest
├── README.md               This file
├── css/
│   └── style.css           All styling & animations
├── js/
│   ├── game.js             Game loop & state management
│   ├── board.js            Board representation & rendering
│   ├── pieces.js           Piece movement rules
│   ├── rules.js            Move validation & rule enforcement
│   ├── ai.js               Chess AI engine (3 levels)
│   └── utils.js            Utility helper functions
└── assets/
    ├── pieces/             Chess piece SVG assets
    ├── board/              Board textures (optional)
    └── sounds/             Sound effects (optional)
```

## Getting Started

### Run Locally

1. Open `index.html` in a modern web browser
2. Select AI difficulty level (Easy/Medium/Hard)
3. Play against the computer

### Install as PWA

1. Open the game in Chrome, Edge, or other PWA-compatible browser
2. Click "Install" or "Add to Home Screen"
3. Play offline on any device

## Controls

### Desktop
- **Click** a piece to select it
- **Click** a highlighted square to move
- **Click** another piece to switch selection

### Mobile / Tablet
- **Tap** a piece to select it
- **Tap** a highlighted square to move
- **Tap** another piece to switch selection

## Chess Rules Summary

### Piece Movement
- **Pawn** — Forward 1 (or 2 on first move), captures diagonally
- **Knight** — L-shaped moves
- **Bishop** — Diagonal any distance
- **Rook** — Horizontal/vertical any distance
- **Queen** — Any direction any distance
- **King** — 1 square in any direction

### Special Rules
- **Castling** — King + Rook swap when conditions are met
- **En Passant** — Pawn captures another pawn's double-push
- **Promotion** — Pawn reaching opposite end becomes Q/R/B/N
- **Check** — King under attack; must escape immediately
- **Checkmate** — King in check with no legal moves; game ends
- **Stalemate** — King not in check but no legal moves; draw

## AI Algorithm

### Easy Mode
- Generates all legal moves
- Selects randomly
- Instant response

### Medium Mode
- Minimax algorithm with 2–3 ply depth
- Piece value evaluation (P=1, N/B=3, R=5, Q=9)
- 1–3 second response time

### Hard Mode
- Minimax with Alpha-Beta Pruning
- Deeper search (3–4 plies)
- Advanced evaluation function:
  - Material balance
  - King safety
  - Center control
  - Piece mobility
- 5–10 second response time

## Technical Details

- **Board Representation** — 8×8 array with piece codes
- **Move Generation** — Legal move filtering with king exposure check
- **Rule Enforcement** — Complete move validation before execution
- **AI Performance** — Optimized reversible move simulation
- **Responsive Layout** — CSS Grid & Flexbox with media queries
- **Browser Compatibility** — All modern browsers (Chrome, Firefox, Safari, Edge)

## Code Quality

- Modular JavaScript architecture
- Clear separation: UI, rules, AI logic
- Meaningful function and variable names
- Comprehensive comments on complex logic
- Zero unused code
- Optimized for performance

## Browser Requirements

- **Minimum** — ES6+ JavaScript support
- **Recommended** — Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile** — iOS Safari 12+, Chrome Mobile 90+

## License

Free to use and modify for personal and educational purposes.

## Notes

- All chess rules are enforced at the logic level; illegal moves are impossible
- The game prevents players from moving during the computer's turn
- Pawn promotion always shows a selection dialog
- Game state is preserved during a session but not persisted to storage
- AI uses deterministic algorithms for consistent gameplay

Enjoy your games!
