/**
 * Pieces Module
 * Piece movement generation and validation
 */

/**
 * Generate all pseudo-legal moves for a piece
 * (Legal moves without considering check)
 * @param {Array<Array>} board
 * @param {number} row
 * @param {number} col
 * @returns {Array<[number, number]>} Array of [toRow, toCol] moves
 */
function getPseudoLegalMoves(board, row, col) {
    const piece = board[row][col];
    if (!piece) return [];

    const color = getPieceColor(piece);
    const type = getPieceType(piece);
    const moves = [];

    switch (type) {
        case 'P':
            moves.push(...getPawnMoves(board, row, col, color));
            break;
        case 'N':
            moves.push(...getKnightMoves(board, row, col, color));
            break;
        case 'B':
            moves.push(...getBishopMoves(board, row, col, color));
            break;
        case 'R':
            moves.push(...getRookMoves(board, row, col, color));
            break;
        case 'Q':
            moves.push(...getQueenMoves(board, row, col, color));
            break;
        case 'K':
            moves.push(...getKingMoves(board, row, col, color));
            break;
    }

    return moves;
}

/**
 * Get pawn moves
 * @param {Array<Array>} board
 * @param {number} row
 * @param {number} col
 * @param {string} color
 * @returns {Array<[number, number]>}
 */
function getPawnMoves(board, row, col, color) {
    const moves = [];
    const direction = color === COLOR.WHITE ? -1 : 1;
    const startRow = color === COLOR.WHITE ? 6 : 1;

    // Forward move (1 square)
    const oneForward = row + direction;
    if (isValidCoord(oneForward, col) && !board[oneForward][col]) {
        moves.push([oneForward, col]);

        // Forward move (2 squares from start)
        if (row === startRow) {
            const twoForward = row + 2 * direction;
            if (!board[twoForward][col]) {
                moves.push([twoForward, col]);
            }
        }
    }

    // Captures (diagonal)
    for (const dCol of [-1, 1]) {
        const captureRow = row + direction;
        const captureCol = col + dCol;
        if (isValidCoord(captureRow, captureCol)) {
            const target = board[captureRow][captureCol];
            if (target && getPieceColor(target) !== color) {
                moves.push([captureRow, captureCol]);
            }
        }
    }

    return moves;
}

/**
 * Get knight moves
 * @param {Array<Array>} board
 * @param {number} row
 * @param {number} col
 * @param {string} color
 * @returns {Array<[number, number]>}
 */
function getKnightMoves(board, row, col, color) {
    const moves = [];
    const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    for (const [dr, dc] of knightOffsets) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (isValidCoord(newRow, newCol)) {
            const target = board[newRow][newCol];
            if (!target || getPieceColor(target) !== color) {
                moves.push([newRow, newCol]);
            }
        }
    }

    return moves;
}

/**
 * Get bishop moves
 * @param {Array<Array>} board
 * @param {number} row
 * @param {number} col
 * @param {string} color
 * @returns {Array<[number, number]>}
 */
function getBishopMoves(board, row, col, color) {
    const moves = [];
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    
    for (const [dr, dc] of directions) {
        for (let dist = 1; dist < 8; dist++) {
            const newRow = row + dr * dist;
            const newCol = col + dc * dist;
            if (!isValidCoord(newRow, newCol)) break;

            const target = board[newRow][newCol];
            if (!target) {
                moves.push([newRow, newCol]);
            } else {
                if (getPieceColor(target) !== color) {
                    moves.push([newRow, newCol]);
                }
                break;
            }
        }
    }

    return moves;
}

/**
 * Get rook moves
 * @param {Array<Array>} board
 * @param {number} row
 * @param {number} col
 * @param {string} color
 * @returns {Array<[number, number]>}
 */
function getRookMoves(board, row, col, color) {
    const moves = [];
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    
    for (const [dr, dc] of directions) {
        for (let dist = 1; dist < 8; dist++) {
            const newRow = row + dr * dist;
            const newCol = col + dc * dist;
            if (!isValidCoord(newRow, newCol)) break;

            const target = board[newRow][newCol];
            if (!target) {
                moves.push([newRow, newCol]);
            } else {
                if (getPieceColor(target) !== color) {
                    moves.push([newRow, newCol]);
                }
                break;
            }
        }
    }

    return moves;
}

/**
 * Get queen moves (combination of rook and bishop)
 * @param {Array<Array>} board
 * @param {number} row
 * @param {number} col
 * @param {string} color
 * @returns {Array<[number, number]>}
 */
function getQueenMoves(board, row, col, color) {
    const moves = [];
    const directions = [
        [0, 1], [0, -1], [1, 0], [-1, 0], // Rook
        [1, 1], [1, -1], [-1, 1], [-1, -1] // Bishop
    ];
    
    for (const [dr, dc] of directions) {
        for (let dist = 1; dist < 8; dist++) {
            const newRow = row + dr * dist;
            const newCol = col + dc * dist;
            if (!isValidCoord(newRow, newCol)) break;

            const target = board[newRow][newCol];
            if (!target) {
                moves.push([newRow, newCol]);
            } else {
                if (getPieceColor(target) !== color) {
                    moves.push([newRow, newCol]);
                }
                break;
            }
        }
    }

    return moves;
}

/**
 * Get king moves (excluding castling)
 * @param {Array<Array>} board
 * @param {number} row
 * @param {number} col
 * @param {string} color
 * @returns {Array<[number, number]>}
 */
function getKingMoves(board, row, col, color) {
    const moves = [];
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (isValidCoord(newRow, newCol)) {
            const target = board[newRow][newCol];
            if (!target || getPieceColor(target) !== color) {
                moves.push([newRow, newCol]);
            }
        }
    }

    return moves;
}

/**
 * Get castling moves for a king
 * @param {Array<Array>} board
 * @param {number} kingRow
 * @param {number} kingCol
 * @param {string} color
 * @param {object} castlingRights - { whiteKingside, whiteQueenside, blackKingside, blackQueenside }
 * @returns {Array<[number, number]>}
 */
function getCastlingMoves(board, kingRow, kingCol, color, castlingRights) {
    const moves = [];
    
    // King must be on starting position
    const isWhite = color === COLOR.WHITE;
    if ((isWhite && kingRow !== 7) || (!isWhite && kingRow !== 0)) {
        return moves;
    }

    // Kingside castling
    if (isWhite && castlingRights.whiteKingside) {
        const rook = board[7][7];
        if (rook === 'R' && !board[7][5] && !board[7][6]) {
            moves.push([7, 6]); // King to g1
        }
    } else if (!isWhite && castlingRights.blackKingside) {
        const rook = board[0][7];
        if (rook === 'r' && !board[0][5] && !board[0][6]) {
            moves.push([0, 6]); // King to g8
        }
    }

    // Queenside castling
    if (isWhite && castlingRights.whiteQueenside) {
        const rook = board[7][0];
        if (rook === 'R' && !board[7][1] && !board[7][2] && !board[7][3]) {
            moves.push([7, 2]); // King to c1
        }
    } else if (!isWhite && castlingRights.blackQueenside) {
        const rook = board[0][0];
        if (rook === 'r' && !board[0][1] && !board[0][2] && !board[0][3]) {
            moves.push([0, 2]); // King to c8
        }
    }

    return moves;
}

/**
 * Check if a pawn can capture en passant
 * @param {Array<Array>} board
 * @param {number} pawnRow
 * @param {number} pawnCol
 * @param {string} color
 * @param {Array<[number, number]>|null} enPassantSquare - The en passant target square
 * @returns {Array<[number, number]>}
 */
function getEnPassantMoves(board, pawnRow, pawnCol, color, enPassantSquare) {
    const moves = [];
    
    if (!enPassantSquare) return moves;
    
    const piece = board[pawnRow][pawnCol];
    if (getPieceType(piece) !== 'P') return moves;

    const direction = color === COLOR.WHITE ? -1 : 1;
    const captureRow = pawnRow + direction;

    // Check if en passant target is on the correct diagonal
    if (enPassantSquare[0] === captureRow) {
        if (Math.abs(enPassantSquare[1] - pawnCol) === 1) {
            moves.push(enPassantSquare);
        }
    }

    return moves;
}
