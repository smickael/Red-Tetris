const { Block, CellEmpty } = require("./types");

class TetrisGame {
  constructor() {
    this.players = new Map();
    this.boards = new Map();
  }

  addPlayer(socketId) {
    this.players.set(socketId, {
      board: this.getEmptyBoard(),
      currentBlock: null,
      nextBlocks: [],
      score: 0,
    });
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  getRandomBlock() {
    console.log("Getting random block");
    const blocks = Object.values(Block);
    const randomIndex = Math.floor(Math.random() * blocks.length);
    return blocks[randomIndex];
  }

  getEmptyBoard(height = 20) {
    return Array(height)
      .fill(null)
      .map(() => Array(10).fill(CellEmpty));
  }

  startGameForPlayer(socketId) {
    const player = this.players.get(socketId);
    if (!player) return;

    const initialBlocks = [
      this.getRandomBlock(),
      this.getRandomBlock(),
      this.getRandomBlock(),
    ];

    player.nextBlocks = initialBlocks;
    player.currentBlock = initialBlocks.pop();
    player.score = 0;
    player.board = this.getEmptyBoard();

    return initialBlocks;
  }

  checkCollision(board, shape, row, col) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const boardRow = row + r;
          const boardCol = col + c;

          if (
            boardRow >= board.length ||
            boardCol < 0 ||
            boardCol >= board[0].length
          ) {
            return true;
          }

          if (boardRow >= 0 && board[boardRow][boardCol] !== CellEmpty) {
            return true;
          }
        }
      }
    }
    return false;
  }
}

module.exports = TetrisGame;
