/**
 * Game Module
 * Main game controller, state management, and game loop
 */

class ChessGame {
    constructor() {
        this.board = new Board();
        this.currentTurn = COLOR.WHITE;
        this.selectedSquare = null;
        this.aiDifficulty = 'easy';
        this.ai = new ChessAI(this.aiDifficulty);
        this.castlingRights = {
            whiteKingside: true,
            whiteQueenside: true,
            blackKingside: true,
            blackQueenside: true
        };
        this.enPassantSquare = null;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.gameOver = false;
        this.gameOverReason = null;
        this.promotionPending = null;
        this.aiThinking = false;

        this.setupDOM();
    }

    /**
     * Setup DOM elements and event listeners
     */
    setupDOM() {
        this.boardContainer = document.getElementById('chessBoard');
        this.resetBtn = document.getElementById('resetBtn');
        this.gameStatus = document.getElementById('gameStatus');
        this.turnDisplay = document.getElementById('turnDisplay');
        this.checkDisplay = document.getElementById('checkDisplay');
        this.moveHistoryEl = document.getElementById('moveHistory');
        this.capturedWhiteList = document.getElementById('capturedWhiteList');
        this.capturedBlackList = document.getElementById('capturedBlackList');
        this.promotionModal = document.getElementById('promotionModal');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.gameOverTitle = document.getElementById('gameOverTitle');
        this.gameOverMessage = document.getElementById('gameOverMessage');
        this.gameOverBtn = document.getElementById('gameOverBtn');
        this.blackPlayerDisplay = document.getElementById('blackPlayer');

        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setDifficulty(e.target.dataset.level));
        });

        // Reset button
        this.resetBtn.addEventListener('click', () => this.reset());

        // Promotion modal
        document.querySelectorAll('.promote-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePromotion(e.target.dataset.piece));
        });

        // Game over modal
        this.gameOverBtn.addEventListener('click', () => this.reset());
    }

    /**
     * Set AI difficulty
     * @param {string} level - 'easy', 'medium', 'hard'
     */
    setDifficulty(level) {
        this.aiDifficulty = level;
        this.ai = new ChessAI(level);

        // Update UI
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-level="${level}"]`).classList.add('active');
        this.blackPlayerDisplay.textContent = `Black: Computer (${level.charAt(0).toUpperCase() + level.slice(1)})`;

        // Reset if a game is in progress
        if (this.moveHistory.length > 0) {
            this.reset();
        }
    }

    /**
     * Reset game to starting position
     */
    reset() {
        this.board = new Board();
        this.currentTurn = COLOR.WHITE;
        this.selectedSquare = null;
        this.castlingRights = {
            whiteKingside: true,
            whiteQueenside: true,
            blackKingside: true,
            blackQueenside: true
        };
        this.enPassantSquare = null;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.gameOver = false;
        this.gameOverReason = null;
        this.promotionPending = null;
        this.aiThinking = false;

        this.updateUI();
        this.render();
    }

    /**
     * Handle square click
     * @param {number} row
     * @param {number} col
     */
    handleSquareClick(row, col) {
        if (this.gameOver || this.aiThinking || this.promotionPending) return;

        // If it's AI's turn, don't allow moves
        if (this.currentTurn === COLOR.BLACK) return;

        const piece = this.board.getPieceAt(row, col);

        // If clicking on own piece, select it
        if (piece && getPieceColor(piece) === this.currentTurn) {
            this.selectedSquare = [row, col];
            this.render();
            return;
        }

        // If a square is selected, try to move
        if (this.selectedSquare) {
            const [fromRow, fromCol] = this.selectedSquare;
            this.tryMove(fromRow, fromCol, row, col);
            return;
        }

        this.render();
    }

    /**
     * Try to move a piece
     * @param {number} fromRow
     * @param {number} fromCol
     * @param {number} toRow
     * @param {number} toCol
     */
    tryMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board.getPieceAt(fromRow, fromCol);
        if (!piece) {
            this.selectedSquare = null;
            this.render();
            return;
        }

        // Check if move is legal
        if (!isMoveLegal(this.board.getBoard(), fromRow, fromCol, toRow, toCol, this.currentTurn, this.castlingRights, this.enPassantSquare)) {
            this.selectedSquare = null;
            this.render();
            return;
        }

        // Make the move
        this.makeMove(fromRow, fromCol, toRow, toCol);
    }

    /**
     * Execute a move
     * @param {number} fromRow
     * @param {number} fromCol
     * @param {number} toRow
     * @param {number} toCol
     */
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board.getPieceAt(fromRow, fromCol);
        const captured = this.board.getPieceAt(toRow, toCol);

        // Determine promotion (needs to happen before move)
        const isPromotion = isPromotionMove(this.board.getBoard(), fromRow, toRow, piece);

        // Handle en passant
        if (isEnPassantMove(fromRow, toRow, toCol, this.board.getBoard(), piece, this.enPassantSquare)) {
            const captureRow = fromRow;
            const capturedEP = this.board.getPieceAt(captureRow, toCol);
            this.capturedPieces[getPieceColor(capturedEP) === COLOR.WHITE ? 'white' : 'black'].push(getPieceType(capturedEP));
            this.board.setPieceAt(captureRow, toCol, null);
        } else if (captured) {
            // Regular capture
            this.capturedPieces[getPieceColor(captured) === COLOR.WHITE ? 'white' : 'black'].push(getPieceType(captured));
        }

        // Handle castling
        if (isCastlingMove(fromRow, fromCol, toRow, toCol, piece)) {
            if (toCol > fromCol) {
                // Kingside castling
                const rook = this.board.getPieceAt(fromRow, 7);
                this.board.setPieceAt(fromRow, 5, rook);
                this.board.setPieceAt(fromRow, 7, null);
            } else {
                // Queenside castling
                const rook = this.board.getPieceAt(fromRow, 0);
                this.board.setPieceAt(fromRow, 3, rook);
                this.board.setPieceAt(fromRow, 0, null);
            }
        }

        // Move piece
        this.board.movePiece(fromRow, fromCol, toRow, toCol);

        // Update castling rights
        this.castlingRights = updateCastlingRights(this.castlingRights, fromRow, fromCol, piece);
        if (captured && getPieceType(captured) === 'R') {
            const captureColor = getPieceColor(captured);
            if (captureColor === COLOR.WHITE) {
                if (toRow === 7 && toCol === 7) this.castlingRights.whiteKingside = false;
                if (toRow === 7 && toCol === 0) this.castlingRights.whiteQueenside = false;
            } else {
                if (toRow === 0 && toCol === 7) this.castlingRights.blackKingside = false;
                if (toRow === 0 && toCol === 0) this.castlingRights.blackQueenside = false;
            }
        }

        // Update en passant square
        this.enPassantSquare = updateEnPassantSquare(fromRow, toRow, toCol, piece);

        // Record move
        const moveNotation = `${coordsToNotation(fromRow, fromCol)}-${coordsToNotation(toRow, toCol)}`;
        this.moveHistory.push(moveNotation);

        // Check for promotion
        if (isPromotion) {
            this.promotionPending = { row: toRow, col: toCol, piece: piece };
            this.selectedSquare = null;
            this.updateUI();
            this.render();
            return;
        }

        // Switch turn
        this.currentTurn = this.currentTurn === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;
        this.selectedSquare = null;
        this.updateUI();
        this.render();

        // AI turn
        if (this.currentTurn === COLOR.BLACK && !this.gameOver) {
            this.aiThinking = true;
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    /**
     * Handle pawn promotion
     * @param {string} piece - New piece type (Q, R, B, N)
     */
    handlePromotion(piece) {
        if (!this.promotionPending) return;

        const { row, col, piece: pawnPiece } = this.promotionPending;
        const color = getPieceColor(pawnPiece);
        const newPiece = createPiece(piece, color);

        this.board.setPieceAt(row, col, newPiece);
        this.promotionPending = null;

        // Switch turn
        this.currentTurn = this.currentTurn === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;
        this.updateUI();
        this.render();

        // AI turn
        if (this.currentTurn === COLOR.BLACK && !this.gameOver) {
            this.aiThinking = true;
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    /**
     * Make AI move
     */
    makeAIMove() {
        const move = this.ai.findBestMove(this.board.getBoard(), COLOR.BLACK, this.castlingRights, this.enPassantSquare);

        if (!move) {
            // No legal moves
            this.endGame();
            return;
        }

        const [fromRow, fromCol] = move.from;
        const [toRow, toCol] = move.to;

        this.makeMove(fromRow, fromCol, toRow, toCol);
        this.aiThinking = false;
    }

    /**
     * Update UI elements
     */
    updateUI() {
        // Turn display
        this.turnDisplay.textContent = this.currentTurn === COLOR.WHITE ? 'White to move' : 'Black to move';

        // Check indicator
        if (isInCheck(this.board.getBoard(), this.currentTurn)) {
            this.checkDisplay.classList.remove('hidden');
        } else {
            this.checkDisplay.classList.add('hidden');
        }

        // Move history
        this.moveHistoryEl.innerHTML = '';
        for (let i = 0; i < this.moveHistory.length; i += 2) {
            const entry = document.createElement('div');
            entry.className = 'move-entry';
            const whiteMove = this.moveHistory[i] || '';
            const blackMove = this.moveHistory[i + 1] || '';
            const moveNum = Math.floor(i / 2) + 1;
            entry.innerHTML = `<strong>${moveNum}.</strong> ${whiteMove} ${blackMove}`;
            this.moveHistoryEl.appendChild(entry);
        }
        this.moveHistoryEl.scrollTop = this.moveHistoryEl.scrollHeight;

        // Captured pieces
        this.capturedWhiteList.innerHTML = this.capturedPieces.white.map(p => `<span class="captured-piece">${getPieceSymbol(p)}</span>`).join('');
        this.capturedBlackList.innerHTML = this.capturedPieces.black.map(p => `<span class="captured-piece">${getPieceSymbol(p)}</span>`).join('');

        // Check for game end
        this.checkGameEnd();
    }

    /**
     * Check for game end conditions
     */
    checkGameEnd() {
        const opponent = this.currentTurn === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;

        if (isCheckmate(this.board.getBoard(), this.currentTurn, this.castlingRights, this.enPassantSquare)) {
            this.endGame(`Checkmate! ${opponent === COLOR.WHITE ? 'White' : 'Black'} wins!`);
        } else if (isStalemate(this.board.getBoard(), this.currentTurn, this.castlingRights, this.enPassantSquare)) {
            this.endGame('Stalemate! Draw!');
        } else if (isInsufficientMaterial(this.board.getBoard())) {
            this.endGame('Insufficient material. Draw!');
        }
    }

    /**
     * End game and show result
     * @param {string} reason
     */
    endGame(reason = null) {
        this.gameOver = true;
        this.gameOverReason = reason || 'Game ended';
        this.aiThinking = false;

        this.gameOverTitle.textContent = 'Game Over';
        this.gameOverMessage.textContent = this.gameOverReason;
        this.gameOverModal.classList.remove('hidden');
    }

    /**
     * Get legal move squares for a piece
     * @param {number} row
     * @param {number} col
     * @returns {Set<string>}
     */
    getLegalMoveSquares(row, col) {
        const legalMoves = getLegalMoves(this.board.getBoard(), row, col, this.castlingRights, this.enPassantSquare, this.currentTurn);
        const set = new Set();
        for (const [r, c] of legalMoves) {
            set.add(`${r},${c}`);
        }
        return set;
    }

    /**
     * Get king in check position
     * @returns {[number, number]|null}
     */
    getKingInCheckPos() {
        if (isInCheck(this.board.getBoard(), this.currentTurn)) {
            return findKing(this.board.getBoard(), this.currentTurn);
        }
        return null;
    }

    /**
     * Render the board
     */
    render() {
        let legalMoveSquares = new Set();
        if (this.selectedSquare) {
            legalMoveSquares = this.getLegalMoveSquares(this.selectedSquare[0], this.selectedSquare[1]);
        }

        const lastMove = this.board.getLastMove();
        const kingInCheckPos = this.getKingInCheckPos();

        renderBoard(
            this.board,
            this.boardContainer,
            (row, col) => this.handleSquareClick(row, col),
            legalMoveSquares,
            lastMove,
            this.selectedSquare,
            kingInCheckPos
        );
    }

    /**
     * Start the game
     */
    start() {
        this.updateUI();
        this.render();
    }
}

// Initialize game on page load
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new ChessGame();
    game.start();
});
