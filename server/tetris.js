const { Block, CellEmpty, SHAPES } = require("./types");

const WIDTH = 10;
const HEIGHT = 20;

class TetrisGame {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = new Map();
    this.isPlaying = false;
    this.blockQueue = [];
    this.gameInterval = null;
    this.gameSpeed = Speed.Normal;
  }

  /**
   * Adds a player to the game
   */
  addPlayer(playerId, playerName) {
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      board: this.getEmptyBoard(),
      score: 0,
      dropRow: 0,
      dropCol: 3,
      dropBlock: null,
      dropShape: null,
      isReady: false,
    });
  }

  /**
   * Removes a player from the game
   */
  removePlayer(playerId) {
    this.players.delete(playerId);

    // End game if no players left
    if (this.players.size === 0) {
      this.endGame();
    }
  }

  /**
   * Returns a random block type
   */
  getRandomBlock() {
    const blocks = Object.keys(SHAPES);
    const randomIndex = Math.floor(Math.random() * blocks.length);
    return blocks[randomIndex];
  }

  /**
   * Creates an empty game board
   */
  getEmptyBoard() {
    return Array(HEIGHT)
      .fill(null)
      .map(() => Array(WIDTH).fill(CellEmpty.Empty));
  }

  /**
   * Starts the game for all players
   */
  startGame() {
    if (this.isPlaying) return;

    // Generate initial block queue (same blocks for all players)
    this.blockQueue = Array(10)
      .fill(null)
      .map(() => this.getRandomBlock());

    // Initialize all players
    for (const [playerId, player] of this.players.entries()) {
      player.board = this.getEmptyBoard();
      player.dropRow = 0;
      player.dropCol = 3;
      player.score = 0;
      player.dropBlock = this.blockQueue[0];
      player.dropShape = SHAPES[this.blockQueue[0]].shape;
    }

    this.isPlaying = true;
    this.startGameLoop();

    return this.blockQueue.slice(0, 3); // Return first three blocks for display
  }

  /**
   * Starts the game loop that handles gravity
   */
  startGameLoop() {
    this.gameInterval = setInterval(() => {
      this.gameStep();
    }, this.gameSpeed);
  }

  /**
   * Game step logic for all players
   */
  gameStep() {
    for (const [playerId, player] of this.players.entries()) {
      // Apply gravity for each player
      const willCollide = this.checkBlockCollision(
        player.board,
        player.dropShape,
        player.dropRow + 1,
        player.dropCol
      );

      if (willCollide) {
        // Commit the block to the board
        this.commitPosition(playerId);
      } else {
        // Move block down
        player.dropRow += 1;
      }
    }

    // Emit updated state to all players
    return this.getGameState();
  }

  /**
   * Commits a block position to the board
   */
  commitPosition(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;

    // Create a deep copy of the board
    const newBoard = JSON.parse(JSON.stringify(player.board));

    // Set the block on the board
    this.setShapeOnBoard(
      newBoard,
      player.dropBlock,
      player.dropShape,
      player.dropRow,
      player.dropCol
    );

    // Clear full lines and calculate score
    const linesCleared = this.clearFullLines(newBoard);
    if (linesCleared > 0) {
      const scoreToAdd = this.calculateScore(linesCleared);
      player.score += scoreToAdd;
    }

    // Get next block from queue and refresh queue if needed
    this.blockQueue.shift();
    if (this.blockQueue.length < 5) {
      this.blockQueue.push(this.getRandomBlock());
    }

    const nextBlock = this.blockQueue[0];

    // Check if game over
    if (this.checkGameOver(newBoard, SHAPES[nextBlock].shape)) {
      this.endGame();
      return;
    }

    // Update player state
    player.board = newBoard;
    player.dropRow = 0;
    player.dropCol = 3;
    player.dropBlock = nextBlock;
    player.dropShape = SHAPES[nextBlock].shape;
  }

  /**
   * Sets the shape on the board
   */
  setShapeOnBoard(board, blockType, shape, row, col) {
    if (!shape) return;

    for (let rowIndex = 0; rowIndex < shape.length; rowIndex++) {
      for (let colIndex = 0; colIndex < shape[rowIndex].length; colIndex++) {
        if (shape[rowIndex][colIndex]) {
          const boardRow = row + rowIndex;
          const boardCol = col + colIndex;

          if (
            boardRow >= 0 &&
            boardRow < board.length &&
            boardCol >= 0 &&
            boardCol < board[0].length
          ) {
            board[boardRow][boardCol] = blockType;
          }
        }
      }
    }
  }

  /**
   * Checks for block collision
   */
  checkBlockCollision(board, shape, row, col) {
    if (!shape) return true;

    for (let rowIndex = 0; rowIndex < shape.length; rowIndex++) {
      for (let colIndex = 0; colIndex < shape[rowIndex].length; colIndex++) {
        if (shape[rowIndex][colIndex]) {
          const boardRow = row + rowIndex;
          const boardCol = col + colIndex;

          if (
            boardRow >= board.length ||
            boardCol < 0 ||
            boardCol >= board[0].length
          ) {
            return true;
          }

          if (boardRow >= 0 && board[boardRow][boardCol] !== CellEmpty.Empty) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Clears full lines and returns the number of lines cleared
   */
  clearFullLines(board) {
    let linesCleared = 0;

    for (let row = board.length - 1; row >= 0; row--) {
      const isFull = board[row].every((cell) => cell !== CellEmpty.Empty);

      if (isFull) {
        linesCleared++;

        // Move all rows above one row down
        for (let y = row; y > 0; y--) {
          board[y] = [...board[y - 1]];
        }

        // Empty the top row
        board[0] = Array(board[0].length).fill(CellEmpty.Empty);

        // Check the same row again
        row++;
      }
    }

    return linesCleared;
  }

  /**
   * Calculates score based on lines cleared
   */
  calculateScore(linesCleared) {
    switch (linesCleared) {
      case 1:
        return 100;
      case 2:
        return 300;
      case 3:
        return 500;
      case 4:
        return 800;
      default:
        return 0;
    }
  }

  /**
   * Checks for game over
   */
  checkGameOver(board, shape) {
    return this.checkBlockCollision(board, shape, 0, 3);
  }

  /**
   * Handles player movement
   */
  handleMove(playerId, direction) {
    const player = this.players.get(playerId);
    if (!player || !this.isPlaying) return null;

    let newCol = player.dropCol;

    if (direction === "left") {
      newCol -= 1;
    } else if (direction === "right") {
      newCol += 1;
    }

    const willCollide = this.checkBlockCollision(
      player.board,
      player.dropShape,
      player.dropRow,
      newCol
    );

    if (!willCollide) {
      player.dropCol = newCol;
      return player.board;
    }

    return null;
  }

  /**
   * Handles rotation
   */
  handleRotate(playerId) {
    const player = this.players.get(playerId);
    if (!player || !this.isPlaying || !player.dropShape) return null;

    const rows = player.dropShape.length;
    const cols = player.dropShape[0].length;

    const rotatedShape = Array(cols)
      .fill(null)
      .map(() => Array(rows).fill(false));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        rotatedShape[col][rows - 1 - row] = player.dropShape[row][col];
      }
    }

    const willCollide = this.checkBlockCollision(
      player.board,
      rotatedShape,
      player.dropRow,
      player.dropCol
    );

    if (!willCollide) {
      player.dropShape = rotatedShape;
      return player.board;
    }

    return null;
  }

  /**
   * Handles hard drop
   */
  handleHardDrop(playerId) {
    const player = this.players.get(playerId);
    if (!player || !this.isPlaying) return null;

    let newRow = player.dropRow;
    let willCollide = false;

    while (!willCollide) {
      newRow++;
      willCollide = this.checkBlockCollision(
        player.board,
        player.dropShape,
        newRow,
        player.dropCol
      );
    }

    player.dropRow = newRow - 1;
    this.commitPosition(playerId);

    return this.getPlayerState(playerId);
  }

  /**
   * Gets the current game state for all players
   */
  getGameState() {
    const gameState = {
      players: {},
      blockQueue: this.blockQueue.slice(0, 3),
      isPlaying: this.isPlaying,
    };

    for (const [playerId, player] of this.players.entries()) {
      gameState.players[playerId] = {
        id: playerId,
        name: player.name,
        score: player.score,
        board: this.getBoardWithCurrentPiece(player),
      };
    }

    return gameState;
  }

  /**
   * Gets the player state for a specific player
   */
  getPlayerState(playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;

    return {
      board: this.getBoardWithCurrentPiece(player),
      score: player.score,
      nextBlocks: this.blockQueue.slice(0, 3),
    };
  }

  /**
   * Gets the board with the current piece rendered on it
   */
  getBoardWithCurrentPiece(player) {
    const renderBoard = JSON.parse(JSON.stringify(player.board));

    if (this.isPlaying && player.dropShape) {
      this.setShapeOnBoard(
        renderBoard,
        player.dropBlock,
        player.dropShape,
        player.dropRow,
        player.dropCol
      );
    }

    return renderBoard;
  }

  /**
   * Ends the game
   */
  endGame() {
    this.isPlaying = false;
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }

    return this.getGameState();
  }
}

module.exports = TetrisGame;
