/**
 * Utility & Helper Functions
 * Shared utilities for board notation, piece lookups, board manipulation
 */

// Piece constants
const PIECE = {
    P: 'P', // Pawn
    N: 'N', // Knight
    B: 'B', // Bishop
    R: 'R', // Rook
    Q: 'Q', // Queen
    K: 'K', // King
    EMPTY: null
};

// Color constants
const COLOR = {
    WHITE: 'white',
    BLACK: 'black'
};

// Piece values for evaluation
const PIECE_VALUE = {
    P: 1,
    N: 3,
    B: 3,
    R: 5,
    Q: 9,
    K: 0
};

// Unicode chess pieces
const PIECE_SYMBOLS = {
    K: '♔', k: '♚',
    Q: '♕', q: '♛',
    R: '♖', r: '♜',
    B: '♗', b: '♝',
    N: '♘', n: '♞',
    P: '♙', p: '♟'
};

/**
 * Convert algebraic notation to [row, col]
 * @param {string} notation - e.g., "e4"
 * @returns {[number, number]} [row, col]
 */
function notationToCoords(notation) {
    const file = notation.charCodeAt(0) - 97; // 'a' = 0, 'h' = 7
    const rank = 8 - parseInt(notation[1]); // '8' = 0, '1' = 7
    return [rank, file];
}

/**
 * Convert [row, col] to algebraic notation
 * @param {number} row
 * @param {number} col
 * @returns {string} e.g., "e4"
 */
function coordsToNotation(row, col) {
    const file = String.fromCharCode(97 + col); // 0 -> 'a'
    const rank = (8 - row).toString(); // 0 -> '8'
    return file + rank;
}

/**
 * Get piece color (white or black)
 * @param {string} piece - Piece code (e.g., 'P', 'k')
 * @returns {string|null} 'white' or 'black' or null
 */
function getPieceColor(piece) {
    if (!piece) return null;
    return piece === piece.toUpperCase() ? COLOR.WHITE : COLOR.BLACK;
}

/**
 * Get piece type (uppercase)
 * @param {string} piece - Piece code (e.g., 'P', 'p')
 * @returns {string|null} Uppercase piece type or null
 */
function getPieceType(piece) {
    if (!piece) return null;
    return piece.toUpperCase();
}

/**
 * Create a piece with color (uppercase = white, lowercase = black)
 * @param {string} type - Piece type (P, N, B, R, Q, K)
 * @param {string} color - Color ('white' or 'black')
 * @returns {string} Piece code
 */
function createPiece(type, color) {
    if (color === COLOR.WHITE) {
        return type.toUpperCase();
    } else {
        return type.toLowerCase();
    }
}

/**
 * Get piece symbol for display
 * @param {string} piece - Piece code
 * @returns {string} Unicode symbol or empty string
 */
function getPieceSymbol(piece) {
    return PIECE_SYMBOLS[piece] || '';
}

/**
 * Deep copy a 2D board array
 * @param {Array<Array>} board - 8x8 board
 * @returns {Array<Array>} Deep copy of board
 */
function copyBoard(board) {
    return board.map(row => [...row]);
}

/**
 * Check if coordinates are within board bounds
 * @param {number} row
 * @param {number} col
 * @returns {boolean}
 */
function isValidCoord(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

/**
 * Get all pieces of a color on the board
 * @param {Array<Array>} board
 * @param {string} color - 'white' or 'black'
 * @returns {Array<{piece: string, row: number, col: number}>}
 */
function getPiecesOfColor(board, color) {
    const pieces = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && getPieceColor(piece) === color) {
                pieces.push({ piece, row, col });
            }
        }
    }
    return pieces;
}

/**
 * Find king position on board
 * @param {Array<Array>} board
 * @param {string} color - 'white' or 'black'
 * @returns {[number, number]|null} [row, col] or null if not found
 */
function findKing(board, color) {
    const kingPiece = color === COLOR.WHITE ? 'K' : 'k';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === kingPiece) {
                return [row, col];
            }
        }
    }
    return null;
}

/**
 * Check if any opponent piece can attack a square
 * @param {Array<Array>} board
 * @param {number} row
 * @param {number} col
 * @param {string} color - Color of player (to find opponent's attacks)
 * @returns {boolean}
 */
function isSquareAttacked(board, row, col, color) {
    const opponent = color === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;
    const pieces = getPiecesOfColor(board, opponent);

    for (const { piece, row: pRow, col: pCol } of pieces) {
        const type = getPieceType(piece);
        const moves = generatePieceMoves(board, pRow, pCol, type);
        if (moves.some(m => m[0] === row && m[1] === col)) {
            return true;
        }
    }
    return false;
}

/**
 * Generate all raw (unfiltered) moves for a piece
 * Used internally for attack detection
 * @param {Array<Array>} board
 * @param {number} row
 * @param {number} col
 * @param {string} type - Piece type (uppercase)
 * @returns {Array<[number, number]>}
 */
function generatePieceMoves(board, row, col, type) {
    const moves = [];
    const piece = board[row][col];
    const color = getPieceColor(piece);

    switch (type) {
        case 'P':
            // Pawn moves
            const direction = color === COLOR.WHITE ? -1 : 1;
            const startRow = color === COLOR.WHITE ? 6 : 1;

            // Forward move
            const oneForward = [row + direction, col];
            if (isValidCoord(oneForward[0], oneForward[1]) && !board[oneForward[0]][oneForward[1]]) {
                moves.push(oneForward);

                // Double move from start
                if (row === startRow) {
                    const twoForward = [row + 2 * direction, col];
                    if (!board[twoForward[0]][twoForward[1]]) {
                        moves.push(twoForward);
                    }
                }
            }

            // Captures
            for (const dCol of [-1, 1]) {
                const capturePos = [row + direction, col + dCol];
                if (isValidCoord(capturePos[0], capturePos[1])) {
                    const target = board[capturePos[0]][capturePos[1]];
                    if (target) {
                        moves.push(capturePos);
                    }
                }
            }
            break;

        case 'N':
            // Knight moves
            const knightMoves = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            for (const [dr, dc] of knightMoves) {
                const newPos = [row + dr, col + dc];
                if (isValidCoord(newPos[0], newPos[1])) {
                    moves.push(newPos);
                }
            }
            break;

        case 'B':
        case 'R':
        case 'Q':
            // Sliding pieces
            const directions = [];
            if (type === 'R' || type === 'Q') {
                directions.push([0, 1], [0, -1], [1, 0], [-1, 0]); // Rook
            }
            if (type === 'B' || type === 'Q') {
                directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]); // Bishop
            }
            for (const [dr, dc] of directions) {
                for (let dist = 1; dist < 8; dist++) {
                    const newPos = [row + dr * dist, col + dc * dist];
                    if (!isValidCoord(newPos[0], newPos[1])) break;
                    moves.push(newPos);
                    if (board[newPos[0]][newPos[1]]) break; // Blocked
                }
            }
            break;

        case 'K':
            // King moves
            const kingMoves = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1], [0, 1],
                [1, -1], [1, 0], [1, 1]
            ];
            for (const [dr, dc] of kingMoves) {
                const newPos = [row + dr, col + dc];
                if (isValidCoord(newPos[0], newPos[1])) {
                    moves.push(newPos);
                }
            }
            break;
    }

    return moves;
}

/**
 * Get all squares between two positions (inclusive)
 * @param {[number, number]} from
 * @param {[number, number]} to
 * @returns {Array<[number, number]>}
 */
function getSquaresBetween(from, to) {
    const [r1, c1] = from;
    const [r2, c2] = to;
    const squares = [];

    const dr = r2 === r1 ? 0 : r2 > r1 ? 1 : -1;
    const dc = c2 === c1 ? 0 : c2 > c1 ? 1 : -1;

    let r = r1, c = c1;
    while (r !== r2 || c !== c2) {
        r += dr;
        c += dc;
        if (r !== r2 || c !== c2) {
            squares.push([r, c]);
        }
    }
    squares.push(to);
    return squares;
}

/**
 * Get difference in rank (for pawn moves)
 * @param {number} fromRow
 * @param {number} toRow
 * @returns {number}
 */
function getRankDifference(fromRow, toRow) {
    return Math.abs(fromRow - toRow);
}

/**
 * Get difference in file (for pawn moves)
 * @param {number} fromCol
 * @param {number} toCol
 * @returns {number}
 */
function getFileDifference(fromCol, toCol) {
    return Math.abs(fromCol - toCol);
}
