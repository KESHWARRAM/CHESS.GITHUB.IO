/**
 * Rules Module
 * Move validation, check/checkmate detection, rule enforcement
 */

/**
 * Get all legal moves for a piece (considering check)
 * @param {Array<Array>} board
 * @param {number} row
 * @param {number} col
 * @param {object} castlingRights
 * @param {Array<[number, number]>|null} enPassantSquare
 * @param {string} color
 * @returns {Array<[number, number]>}
 */
function getLegalMoves(board, row, col, castlingRights, enPassantSquare, color) {
    const piece = board[row][col];
    if (!piece || getPieceColor(piece) !== color) {
        return [];
    }

    const pseudoLegal = getPseudoLegalMoves(board, row, col);
    const type = getPieceType(piece);
    
    // Add castling moves for king
    if (type === 'K') {
        const castles = getCastlingMoves(board, row, col, color, castlingRights);
        pseudoLegal.push(...castles);
    }

    // Add en passant moves for pawn
    if (type === 'P') {
        const enPassant = getEnPassantMoves(board, row, col, color, enPassantSquare);
        pseudoLegal.push(...enPassant);
    }

    // Filter out moves that leave king in check
    const legal = pseudoLegal.filter(([toRow, toCol]) => {
        return !wouldLeaveKingInCheck(board, row, col, toRow, toCol, color, castlingRights, enPassantSquare);
    });

    return legal;
}

/**
 * Check if a move would leave own king in check
 * @param {Array<Array>} board
 * @param {number} fromRow
 * @param {number} fromCol
 * @param {number} toRow
 * @param {number} toCol
 * @param {string} color
 * @param {object} castlingRights
 * @param {Array<[number, number]>|null} enPassantSquare
 * @returns {boolean}
 */
function wouldLeaveKingInCheck(board, fromRow, fromCol, toRow, toCol, color, castlingRights, enPassantSquare) {
    // Simulate the move on a copy
    const testBoard = copyBoard(board);
    const piece = testBoard[fromRow][fromCol];
    
    // Handle en passant
    if (piece && getPieceType(piece) === 'P' && enPassantSquare && toRow === enPassantSquare[0] && toCol === enPassantSquare[1]) {
        const captureRow = fromRow;
        testBoard[toRow][toCol] = piece;
        testBoard[fromRow][fromCol] = null;
        testBoard[captureRow][toCol] = null;
    } else {
        // Regular move
        testBoard[toRow][toCol] = piece;
        testBoard[fromRow][fromCol] = null;
    }

    // Handle castling (move rook too)
    if (piece && getPieceType(piece) === 'K') {
        const isWhite = getPieceColor(piece) === COLOR.WHITE;
        if (isWhite && fromRow === 7 && fromCol === 4) {
            // Kingside castling
            if (toCol === 6) {
                testBoard[7][5] = testBoard[7][7];
                testBoard[7][7] = null;
            }
            // Queenside castling
            if (toCol === 2) {
                testBoard[7][3] = testBoard[7][0];
                testBoard[7][0] = null;
            }
        } else if (!isWhite && fromRow === 0 && fromCol === 4) {
            // Kingside castling
            if (toCol === 6) {
                testBoard[0][5] = testBoard[0][7];
                testBoard[0][7] = null;
            }
            // Queenside castling
            if (toCol === 2) {
                testBoard[0][3] = testBoard[0][0];
                testBoard[0][0] = null;
            }
        }
    }

    // Find king position in test board
    let kingPos = findKing(testBoard, color);
    if (!kingPos) return true; // King disappeared (shouldn't happen)

    // Check if king is under attack
    return isSquareAttacked(testBoard, kingPos[0], kingPos[1], color);
}

/**
 * Check if a color is in check
 * @param {Array<Array>} board
 * @param {string} color
 * @returns {boolean}
 */
function isInCheck(board, color) {
    const kingPos = findKing(board, color);
    if (!kingPos) return false;
    return isSquareAttacked(board, kingPos[0], kingPos[1], color);
}

/**
 * Check if a color is in checkmate
 * @param {Array<Array>} board
 * @param {string} color
 * @param {object} castlingRights
 * @param {Array<[number, number]>|null} enPassantSquare
 * @returns {boolean}
 */
function isCheckmate(board, color, castlingRights, enPassantSquare) {
    if (!isInCheck(board, color)) return false;

    const pieces = getPiecesOfColor(board, color);
    for (const { row, col } of pieces) {
        const legal = getLegalMoves(board, row, col, castlingRights, enPassantSquare, color);
        if (legal.length > 0) {
            return false; // Has at least one legal move
        }
    }
    return true; // No legal moves and in check
}

/**
 * Check if a color is in stalemate
 * @param {Array<Array>} board
 * @param {string} color
 * @param {object} castlingRights
 * @param {Array<[number, number]>|null} enPassantSquare
 * @returns {boolean}
 */
function isStalemate(board, color, castlingRights, enPassantSquare) {
    if (isInCheck(board, color)) return false;

    const pieces = getPiecesOfColor(board, color);
    for (const { row, col } of pieces) {
        const legal = getLegalMoves(board, row, col, castlingRights, enPassantSquare, color);
        if (legal.length > 0) {
            return false; // Has at least one legal move
        }
    }
    return true; // No legal moves and not in check
}

/**
 * Check if there is insufficient material to checkmate
 * Insufficient material: K vs K, K vs KB, K vs KN, KB vs KB (same color bishops)
 * @param {Array<Array>} board
 * @returns {boolean}
 */
function isInsufficientMaterial(board) {
    const whitePieces = getPiecesOfColor(board, COLOR.WHITE);
    const blackPieces = getPiecesOfColor(board, COLOR.BLACK);

    // Only kings
    if (whitePieces.length === 1 && blackPieces.length === 1) {
        return true;
    }

    // King + Knight/Bishop vs King
    const whiteNonKing = whitePieces.filter(p => getPieceType(p.piece) !== 'K');
    const blackNonKing = blackPieces.filter(p => getPieceType(p.piece) !== 'K');

    // K vs K
    if (whiteNonKing.length === 0 && blackNonKing.length === 0) {
        return true;
    }

    // K + N/B vs K
    if ((whiteNonKing.length === 1 && blackNonKing.length === 0) || 
        (whiteNonKing.length === 0 && blackNonKing.length === 1)) {
        const piece = whiteNonKing.length === 1 ? whiteNonKing[0] : blackNonKing[0];
        const type = getPieceType(piece.piece);
        if (type === 'N' || type === 'B') {
            return true;
        }
    }

    // K+B vs K+B (same color bishops)
    if (whiteNonKing.length === 1 && blackNonKing.length === 1) {
        const wpType = getPieceType(whiteNonKing[0].piece);
        const bpType = getPieceType(blackNonKing[0].piece);
        if (wpType === 'B' && bpType === 'B') {
            // Check if bishops are on same color squares
            const wRow = whiteNonKing[0].row;
            const wCol = whiteNonKing[0].col;
            const bRow = blackNonKing[0].row;
            const bCol = blackNonKing[0].col;
            const wSquareColor = (wRow + wCol) % 2;
            const bSquareColor = (bRow + bCol) % 2;
            if (wSquareColor === bSquareColor) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Check if a move is a pawn promotion
 * @param {Array<Array>} board
 * @param {number} fromRow
 * @param {number} toRow
 * @param {string} piece
 * @returns {boolean}
 */
function isPromotionMove(board, fromRow, toRow, piece) {
    if (getPieceType(piece) !== 'P') return false;
    
    const isWhite = getPieceColor(piece) === COLOR.WHITE;
    return (isWhite && toRow === 0) || (!isWhite && toRow === 7);
}

/**
 * Check if a move is a castling move
 * @param {number} fromRow
 * @param {number} fromCol
 * @param {number} toRow
 * @param {number} toCol
 * @param {string} piece
 * @returns {boolean}
 */
function isCastlingMove(fromRow, fromCol, toRow, toCol, piece) {
    if (getPieceType(piece) !== 'K') return false;
    if (fromRow !== toRow) return false;
    return Math.abs(toCol - fromCol) === 2;
}

/**
 * Check if a move is an en passant capture
 * @param {number} fromRow
 * @param {number} toRow
 * @param {number} toCol
 * @param {Array<Array>} board
 * @param {string} piece
 * @param {Array<[number, number]>|null} enPassantSquare
 * @returns {boolean}
 */
function isEnPassantMove(fromRow, toRow, toCol, board, piece, enPassantSquare) {
    if (getPieceType(piece) !== 'P') return false;
    if (!enPassantSquare) return false;
    if (toRow !== enPassantSquare[0] || toCol !== enPassantSquare[1]) return false;
    if (board[toRow][toCol] !== null) return false; // Target square must be empty
    return true;
}

/**
 * Update castling rights after a move
 * @param {object} castlingRights
 * @param {number} fromRow
 * @param {number} fromCol
 * @param {string} piece
 * @returns {object} Updated castling rights
 */
function updateCastlingRights(castlingRights, fromRow, fromCol, piece) {
    const newRights = { ...castlingRights };
    const type = getPieceType(piece);
    const color = getPieceColor(piece);

    // King moved
    if (type === 'K') {
        if (color === COLOR.WHITE) {
            newRights.whiteKingside = false;
            newRights.whiteQueenside = false;
        } else {
            newRights.blackKingside = false;
            newRights.blackQueenside = false;
        }
    }

    // Rook moved (white kingside)
    if (color === COLOR.WHITE && fromRow === 7 && fromCol === 7) {
        newRights.whiteKingside = false;
    }
    // Rook moved (white queenside)
    if (color === COLOR.WHITE && fromRow === 7 && fromCol === 0) {
        newRights.whiteQueenside = false;
    }
    // Rook moved (black kingside)
    if (color === COLOR.BLACK && fromRow === 0 && fromCol === 7) {
        newRights.blackKingside = false;
    }
    // Rook moved (black queenside)
    if (color === COLOR.BLACK && fromRow === 0 && fromCol === 0) {
        newRights.blackQueenside = false;
    }

    return newRights;
}

/**
 * Update en passant square after a pawn move
 * @param {number} fromRow
 * @param {number} toRow
 * @param {number} toCol
 * @param {string} piece
 * @returns {[number, number]|null} En passant target square or null
 */
function updateEnPassantSquare(fromRow, toRow, toCol, piece) {
    if (getPieceType(piece) !== 'P') return null;
    if (Math.abs(toRow - fromRow) !== 2) return null; // Must be double push
    
    // En passant square is the square the pawn skipped over
    const enPassantRow = (fromRow + toRow) / 2;
    return [enPassantRow, toCol];
}

/**
 * Validate if a move is legal
 * @param {Array<Array>} board
 * @param {number} fromRow
 * @param {number} fromCol
 * @param {number} toRow
 * @param {number} toCol
 * @param {string} color
 * @param {object} castlingRights
 * @param {Array<[number, number]>|null} enPassantSquare
 * @returns {boolean}
 */
function isMoveLegal(board, fromRow, fromCol, toRow, toCol, color, castlingRights, enPassantSquare) {
    const legalMoves = getLegalMoves(board, fromRow, fromCol, castlingRights, enPassantSquare, color);
    return legalMoves.some(m => m[0] === toRow && m[1] === toCol);
}
