/**
 * Board Module
 * Manages 8x8 board representation, initialization, and rendering
 */

class Board {
    constructor() {
        this.board = this.initializeBoard();
        this.lastMove = null;
    }

    /**
     * Initialize board with starting position
     * @returns {Array<Array>} 8x8 board with pieces
     */
    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));

        // Black pieces (top)
        board[0][0] = 'r'; board[0][1] = 'n'; board[0][2] = 'b'; board[0][3] = 'q';
        board[0][4] = 'k'; board[0][5] = 'b'; board[0][6] = 'n'; board[0][7] = 'r';
        for (let col = 0; col < 8; col++) {
            board[1][col] = 'p';
        }

        // White pieces (bottom)
        for (let col = 0; col < 8; col++) {
            board[6][col] = 'P';
        }
        board[7][0] = 'R'; board[7][1] = 'N'; board[7][2] = 'B'; board[7][3] = 'Q';
        board[7][4] = 'K'; board[7][5] = 'B'; board[7][6] = 'N'; board[7][7] = 'R';

        return board;
    }

    /**
     * Get piece at position
     * @param {number} row
     * @param {number} col
     * @returns {string|null} Piece code or null
     */
    getPieceAt(row, col) {
        if (!isValidCoord(row, col)) return null;
        return this.board[row][col];
    }

    /**
     * Set piece at position
     * @param {number} row
     * @param {number} col
     * @param {string|null} piece
     */
    setPieceAt(row, col, piece) {
        if (isValidCoord(row, col)) {
            this.board[row][col] = piece;
        }
    }

    /**
     * Move piece from one square to another
     * @param {number} fromRow
     * @param {number} fromCol
     * @param {number} toRow
     * @param {number} toCol
     * @returns {string|null} Captured piece or null
     */
    movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPieceAt(fromRow, fromCol);
        const captured = this.getPieceAt(toRow, toCol);

        this.setPieceAt(toRow, toCol, piece);
        this.setPieceAt(fromRow, fromCol, null);

        this.lastMove = {
            from: [fromRow, fromCol],
            to: [toRow, toCol],
            piece: piece,
            captured: captured
        };

        return captured;
    }

    /**
     * Get last move played
     * @returns {object|null} Last move object or null
     */
    getLastMove() {
        return this.lastMove;
    }

    /**
     * Clear last move tracking
     */
    clearLastMove() {
        this.lastMove = null;
    }

    /**
     * Reset board to starting position
     */
    reset() {
        this.board = this.initializeBoard();
        this.lastMove = null;
    }

    /**
     * Create a copy of the current board
     * @returns {Array<Array>} Deep copy of board
     */
    copy() {
        return copyBoard(this.board);
    }

    /**
     * Get the raw board array
     * @returns {Array<Array>}
     */
    getBoard() {
        return this.board;
    }

    /**
     * Set the entire board state
     * @param {Array<Array>} newBoard
     */
    setBoard(newBoard) {
        this.board = copyBoard(newBoard);
    }

    /**
     * Get board state as FEN-like string (simplified)
     * For move history/logging
     * @returns {string}
     */
    toString() {
        let fen = '';
        for (let row = 0; row < 8; row++) {
            let empty = 0;
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    if (empty > 0) {
                        fen += empty;
                        empty = 0;
                    }
                    fen += piece;
                } else {
                    empty++;
                }
            }
            if (empty > 0) {
                fen += empty;
            }
            if (row < 7) fen += '/';
        }
        return fen;
    }
}

/**
 * Render the board to the DOM
 * @param {Board} board - Board instance
 * @param {HTMLElement} container - DOM container for board
 * @param {Function} onSquareClick - Callback when square is clicked
 * @param {Set<string>} legalMoveSquares - Set of legal move squares (as "row,col")
 * @param {Array<[number, number]>|null} lastMove - Last move played
 * @param {Array<[number, number]>|null} selectedSquare - Currently selected square
 * @param {Array<[number, number]>|null} kingInCheckPos - King in check position
 */
function renderBoard(board, container, onSquareClick, legalMoveSquares = new Set(), lastMove = null, selectedSquare = null, kingInCheckPos = null) {
    container.innerHTML = '';

    const boardArray = board.getBoard();

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'square';

            // Checkerboard pattern
            const isLight = (row + col) % 2 === 0;
            square.classList.add(isLight ? 'white' : 'black');

            // Add square data attributes for identification
            square.dataset.row = row;
            square.dataset.col = col;

            // Check if this is the king in check
            if (kingInCheckPos && kingInCheckPos[0] === row && kingInCheckPos[1] === col) {
                square.classList.add('in-check');
            }

            // Check if this is part of last move
            if (lastMove) {
                const [fromRow, fromCol] = lastMove.from;
                const [toRow, toCol] = lastMove.to;
                if ((row === fromRow && col === fromCol) || (row === toRow && col === toCol)) {
                    square.classList.add('last-move');
                }
            }

            // Check if selected
            if (selectedSquare && selectedSquare[0] === row && selectedSquare[1] === col) {
                square.classList.add('selected');
            }

            // Check if legal move or legal capture
            const squareKey = `${row},${col}`;
            if (legalMoveSquares.has(squareKey)) {
                const targetPiece = boardArray[row][col];
                if (targetPiece) {
                    square.classList.add('legal-capture');
                } else {
                    square.classList.add('legal-move');
                }
            }

            // Add piece if present
            const piece = boardArray[row][col];
            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.className = 'piece';
                pieceElement.textContent = getPieceSymbol(piece);
                square.appendChild(pieceElement);
            }

            // Click handler
            square.addEventListener('click', () => {
                onSquareClick(row, col);
            });

            container.appendChild(square);
        }
    }
}
