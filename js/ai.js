/**
 * AI Module
 * Chess AI engine with three difficulty levels
 */

class ChessAI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty; // 'easy', 'medium', 'hard'
        this.maxDepth = this.getMaxDepth();
    }

    /**
     * Get max search depth based on difficulty
     * @returns {number}
     */
    getMaxDepth() {
        switch (this.difficulty) {
            case 'easy':
                return 0; // No lookahead
            case 'medium':
                return 2;
            case 'hard':
                return 4;
            default:
                return 2;
        }
    }

    /**
     * Find best move for AI
     * @param {Array<Array>} board
     * @param {string} color - AI color ('white' or 'black')
     * @param {object} castlingRights
     * @param {Array<[number, number]>|null} enPassantSquare
     * @returns {object} { from: [r,c], to: [r,c] } or null
     */
    findBestMove(board, color, castlingRights, enPassantSquare) {
        if (this.difficulty === 'easy') {
            return this.getRandomMove(board, color, castlingRights, enPassantSquare);
        }

        if (this.difficulty === 'medium') {
            return this.minimax(board, color, castlingRights, enPassantSquare, this.maxDepth, true);
        }

        if (this.difficulty === 'hard') {
            return this.minimaxAlphaBeta(board, color, castlingRights, enPassantSquare, this.maxDepth, -Infinity, Infinity, true);
        }

        return this.getRandomMove(board, color, castlingRights, enPassantSquare);
    }

    /**
     * Get a random legal move (Easy difficulty)
     * @param {Array<Array>} board
     * @param {string} color
     * @param {object} castlingRights
     * @param {Array<[number, number]>|null} enPassantSquare
     * @returns {object|null}
     */
    getRandomMove(board, color, castlingRights, enPassantSquare) {
        const allMoves = this.getAllLegalMoves(board, color, castlingRights, enPassantSquare);
        if (allMoves.length === 0) return null;
        return allMoves[Math.floor(Math.random() * allMoves.length)];
    }

    /**
     * Minimax without alpha-beta pruning (Medium difficulty)
     * @param {Array<Array>} board
     * @param {string} color
     * @param {object} castlingRights
     * @param {Array<[number, number]>|null} enPassantSquare
     * @param {number} depth
     * @param {boolean} isMaximizing
     * @returns {object|null} Best move
     */
    minimax(board, color, castlingRights, enPassantSquare, depth, isMaximizing) {
        if (depth === 0) {
            return null; // Just for the root call
        }

        const moves = this.getAllLegalMoves(board, color, castlingRights, enPassantSquare);
        if (moves.length === 0) return null;

        let bestMove = moves[0];
        let bestValue = isMaximizing ? -Infinity : Infinity;

        for (const move of moves) {
            const { score } = this.minimaxSearch(board, color, castlingRights, enPassantSquare, depth - 1, !isMaximizing);
            
            if (isMaximizing && score > bestValue) {
                bestValue = score;
                bestMove = move;
            } else if (!isMaximizing && score < bestValue) {
                bestValue = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    /**
     * Minimax search (internal)
     * @returns {object} { score }
     */
    minimaxSearch(board, color, castlingRights, enPassantSquare, depth, isMaximizing) {
        // Terminal conditions
        const opponent = color === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;
        
        if (isCheckmate(board, isMaximizing ? color : opponent, castlingRights, enPassantSquare)) {
            return { score: isMaximizing ? 10000 : -10000 };
        }
        
        if (isStalemate(board, isMaximizing ? color : opponent, castlingRights, enPassantSquare)) {
            return { score: 0 };
        }
        
        if (isInsufficientMaterial(board)) {
            return { score: 0 };
        }

        if (depth === 0) {
            return { score: this.evaluateBoard(board, color) };
        }

        const currentColor = isMaximizing ? color : opponent;
        const moves = this.getAllLegalMoves(board, currentColor, castlingRights, enPassantSquare);

        let bestScore = isMaximizing ? -Infinity : Infinity;

        for (const move of moves) {
            const { newBoard, newCastling, newEnPassant } = this.simulateMove(board, move, castlingRights, enPassantSquare);
            const { score } = this.minimaxSearch(newBoard, color, newCastling, newEnPassant, depth - 1, !isMaximizing);

            if (isMaximizing) {
                bestScore = Math.max(bestScore, score);
            } else {
                bestScore = Math.min(bestScore, score);
            }
        }

        return { score: bestScore };
    }

    /**
     * Minimax with Alpha-Beta Pruning (Hard difficulty)
     * @returns {object|null} Best move
     */
    minimaxAlphaBeta(board, color, castlingRights, enPassantSquare, depth, alpha, beta, isMaximizing) {
        if (depth === 0) {
            return null;
        }

        const moves = this.getAllLegalMoves(board, color, castlingRights, enPassantSquare);
        if (moves.length === 0) return null;

        let bestMove = moves[0];
        let bestValue = isMaximizing ? -Infinity : Infinity;

        for (const move of moves) {
            const { score } = this.minimaxSearchAlphaBeta(board, color, castlingRights, enPassantSquare, depth - 1, alpha, beta, !isMaximizing);

            if (isMaximizing) {
                if (score > bestValue) {
                    bestValue = score;
                    bestMove = move;
                }
                alpha = Math.max(alpha, bestValue);
            } else {
                if (score < bestValue) {
                    bestValue = score;
                    bestMove = move;
                }
                beta = Math.min(beta, bestValue);
            }

            if (beta <= alpha) {
                break; // Beta cutoff
            }
        }

        return bestMove;
    }

    /**
     * Minimax search with Alpha-Beta Pruning (internal)
     * @returns {object} { score }
     */
    minimaxSearchAlphaBeta(board, color, castlingRights, enPassantSquare, depth, alpha, beta, isMaximizing) {
        const opponent = color === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;

        if (isCheckmate(board, isMaximizing ? color : opponent, castlingRights, enPassantSquare)) {
            return { score: isMaximizing ? 10000 : -10000 };
        }

        if (isStalemate(board, isMaximizing ? color : opponent, castlingRights, enPassantSquare)) {
            return { score: 0 };
        }

        if (isInsufficientMaterial(board)) {
            return { score: 0 };
        }

        if (depth === 0) {
            return { score: this.evaluateBoard(board, color) };
        }

        const currentColor = isMaximizing ? color : opponent;
        const moves = this.getAllLegalMoves(board, currentColor, castlingRights, enPassantSquare);

        let bestScore = isMaximizing ? -Infinity : Infinity;

        for (const move of moves) {
            const { newBoard, newCastling, newEnPassant } = this.simulateMove(board, move, castlingRights, enPassantSquare);
            const { score } = this.minimaxSearchAlphaBeta(newBoard, color, newCastling, newEnPassant, depth - 1, alpha, beta, !isMaximizing);

            if (isMaximizing) {
                bestScore = Math.max(bestScore, score);
                alpha = Math.max(alpha, bestScore);
            } else {
                bestScore = Math.min(bestScore, score);
                beta = Math.min(beta, bestScore);
            }

            if (beta <= alpha) {
                break; // Beta cutoff
            }
        }

        return { score: bestScore };
    }

    /**
     * Evaluate board position (static evaluation)
     * @param {Array<Array>} board
     * @param {string} color - AI's color
     * @returns {number} Positive = AI advantage, Negative = opponent advantage
     */
    evaluateBoard(board, color) {
        let score = 0;

        // Material count
        const whitePieces = getPiecesOfColor(board, COLOR.WHITE);
        const blackPieces = getPiecesOfColor(board, COLOR.BLACK);

        for (const { piece } of whitePieces) {
            score += PIECE_VALUE[getPieceType(piece)];
        }

        for (const { piece } of blackPieces) {
            score -= PIECE_VALUE[getPieceType(piece)];
        }

        // Adjust based on AI color
        if (color === COLOR.BLACK) {
            score = -score;
        }

        // King safety (basic)
        const kingPos = findKing(board, color);
        if (kingPos) {
            const safetyScore = this.evaluateKingSafety(board, kingPos, color);
            score += safetyScore;
        }

        // Center control
        const centerScore = this.evaluateCenterControl(board, color);
        score += centerScore * 0.3;

        // Piece mobility (simplified)
        const mobilityScore = this.evaluateMobility(board, color);
        score += mobilityScore * 0.1;

        return score;
    }

    /**
     * Evaluate king safety
     * @param {Array<Array>} board
     * @param {[number, number]} kingPos
     * @param {string} color
     * @returns {number}
     */
    evaluateKingSafety(board, kingPos, color) {
        let safety = 0;

        // Bonus for castled position (king on g/c file)
        const kingCol = kingPos[1];
        if (kingCol === 6 || kingCol === 2) {
            safety += 15; // Castled king is safer
        }

        // Penalty for king in center
        if (kingCol >= 3 && kingCol <= 4 && (kingPos[0] >= 2 && kingPos[0] <= 5)) {
            safety -= 20;
        }

        return safety;
    }

    /**
     * Evaluate center control (pawns and pieces)
     * @param {Array<Array>} board
     * @param {string} color
     * @returns {number}
     */
    evaluateCenterControl(board, color) {
        let control = 0;
        const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];

        for (const [row, col] of centerSquares) {
            const piece = board[row][col];
            if (piece && getPieceColor(piece) === color) {
                control += PIECE_VALUE[getPieceType(piece)];
            } else if (piece && getPieceColor(piece) !== color) {
                control -= PIECE_VALUE[getPieceType(piece)];
            }
        }

        return control;
    }

    /**
     * Evaluate piece mobility (number of legal moves)
     * @param {Array<Array>} board
     * @param {string} color
     * @returns {number}
     */
    evaluateMobility(board, color) {
        let moves = 0;
        // Simplified: just count pieces (full mobility calculation is expensive)
        const pieces = getPiecesOfColor(board, color);
        return pieces.length * 2; // Rough approximation
    }

    /**
     * Get all legal moves for a color
     * @param {Array<Array>} board
     * @param {string} color
     * @param {object} castlingRights
     * @param {Array<[number, number]>|null} enPassantSquare
     * @returns {Array<{from: [r,c], to: [r,c]}>}
     */
    getAllLegalMoves(board, color, castlingRights, enPassantSquare) {
        const moves = [];
        const pieces = getPiecesOfColor(board, color);

        for (const { row, col } of pieces) {
            const legalMoves = getLegalMoves(board, row, col, castlingRights, enPassantSquare, color);
            for (const [toRow, toCol] of legalMoves) {
                moves.push({ from: [row, col], to: [toRow, toCol] });
            }
        }

        return moves;
    }

    /**
     * Simulate a move and return new game state
     * @param {Array<Array>} board
     * @param {object} move - { from: [r,c], to: [r,c] }
     * @param {object} castlingRights
     * @param {Array<[number, number]>|null} enPassantSquare
     * @returns {object} { newBoard, newCastling, newEnPassant }
     */
    simulateMove(board, move, castlingRights, enPassantSquare) {
        const newBoard = copyBoard(board);
        const [fromRow, fromCol] = move.from;
        const [toRow, toCol] = move.to;
        const piece = newBoard[fromRow][fromCol];

        // Handle en passant
        if (piece && getPieceType(piece) === 'P' && enPassantSquare && toRow === enPassantSquare[0] && toCol === enPassantSquare[1]) {
            const captureRow = fromRow;
            newBoard[toRow][toCol] = piece;
            newBoard[fromRow][fromCol] = null;
            newBoard[captureRow][toCol] = null;
        } else {
            newBoard[toRow][toCol] = piece;
            newBoard[fromRow][fromCol] = null;
        }

        // Handle castling
        if (piece && getPieceType(piece) === 'K') {
            const isWhite = getPieceColor(piece) === COLOR.WHITE;
            if (isWhite && fromRow === 7 && fromCol === 4) {
                if (toCol === 6) {
                    newBoard[7][5] = newBoard[7][7];
                    newBoard[7][7] = null;
                }
                if (toCol === 2) {
                    newBoard[7][3] = newBoard[7][0];
                    newBoard[7][0] = null;
                }
            } else if (!isWhite && fromRow === 0 && fromCol === 4) {
                if (toCol === 6) {
                    newBoard[0][5] = newBoard[0][7];
                    newBoard[0][7] = null;
                }
                if (toCol === 2) {
                    newBoard[0][3] = newBoard[0][0];
                    newBoard[0][0] = null;
                }
            }
        }

        // Update castling rights
        let newCastling = updateCastlingRights(castlingRights, fromRow, fromCol, piece);

        // Handle captured rook (also lose castling rights)
        const capturedPiece = board[toRow][toCol];
        if (capturedPiece && getPieceType(capturedPiece) === 'R') {
            const captureColor = getPieceColor(capturedPiece);
            if (captureColor === COLOR.WHITE) {
                if (toRow === 7 && toCol === 7) newCastling.whiteKingside = false;
                if (toRow === 7 && toCol === 0) newCastling.whiteQueenside = false;
            } else {
                if (toRow === 0 && toCol === 7) newCastling.blackKingside = false;
                if (toRow === 0 && toCol === 0) newCastling.blackQueenside = false;
            }
        }

        // Update en passant
        let newEnPassant = null;
        if (piece && getPieceType(piece) === 'P' && Math.abs(toRow - fromRow) === 2) {
            newEnPassant = [(fromRow + toRow) / 2, toCol];
        }

        return { newBoard, newCastling, newEnPassant };
    }
}
