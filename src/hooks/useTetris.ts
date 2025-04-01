import { useCallback, useState, useEffect } from "react";
import { checkBlockCollision, getRandomBlock, useBoard } from "./useBoard";
import { useRepeatingStep } from "./useRepeatingStep";
import {
  Block,
  BlockShape,
  BoardShape,
  CellEmpty,
  SHAPES,
} from "../utils/types";
import { useSocket } from "../useSocket";

// Game speed constants in milliseconds
enum Speed {
  Normal = 800,
  Fast = 400,
  Faster = 200,
  Slide = 100,
}

type Room = {
  id: string;
  roomName: string;
  players: string[];
};

export function useTetris() {
  const socket = useSocket();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed | null>(null);
  const [isCommit, setIsCommit] = useState(false);
  const [nextBlocks, setNextBlocks] = useState<Block[]>([]);
  const [score, setScore] = useState(0);
  const [roomsList, setRoomsList] = useState<Room[]>([]);

  const [
    { board, dropRow, dropCol, dropBlock, dropShape },
    dispatchBoardState,
  ] = useBoard();

  useEffect(() => {
    if (socket) {
      socket.emit("getRooms");

      socket.on("pieceMoved", (newBoard: BoardShape) => {
        // Update the board state based on the server's response
        dispatchBoardState({ type: "commit", newBoard });
      });

      socket.on("gameStarted", (initialBlocks: Block[]) => {
        setNextBlocks(initialBlocks);
        setIsPlaying(true);
        setSpeed(Speed.Normal);
        setScore(0);
        dispatchBoardState({ type: "start" });
      });

      socket.on("roomsList", (rooms) => {
        console.log("Received rooms list:", rooms);
        const roomsList = JSON.parse(rooms);
        setRoomsList(roomsList);
        console.log("Rooms list:", roomsList);
      });
    }
  }, [socket, dispatchBoardState]);

  const createRoom = useCallback(
    (roomName: string) => {
      if (socket) {
        socket.emit("createRoom", roomName);
      }
    },
    [socket]
  );

  const joinRoom = useCallback(
    (room: Room) => {
      if (socket) {
        socket.emit("joinRoom", room.id);
      }
    },
    [socket]
  );

  /**
   * Start a new game by setting up the first blocks
   * and starting the game loop
   */
  const startGame = useCallback(() => {
    if (socket) {
      socket.emit("startGame");
    }

    const firstBlocks = [getRandomBlock(), getRandomBlock(), getRandomBlock()];
    setNextBlocks(firstBlocks);
    setIsPlaying(true);
    setSpeed(Speed.Normal);
    setScore(0);
    dispatchBoardState({ type: "start" });
  }, [dispatchBoardState, socket]);

  /**
   * Ends the current game when it's game over
   */
  const endGame = useCallback(() => {
    setIsPlaying(false);
    setSpeed(null);
    console.log("Game over. Score:", score);
  }, [score]);

  /**
   * Checks if the board has any full lines and clears them
   * Returns the number of lines cleared for the score
   */
  const clearFullLines = useCallback((gameBoard: BoardShape) => {
    let linesCleared = 0;

    for (let row = gameBoard.length - 1; row >= 0; row--) {
      const isFull = gameBoard[row].every((cell) => cell !== CellEmpty.Empty);

      if (isFull) {
        linesCleared++;

        //Move all rows above one row down
        for (let y = row; y > 0; y--) {
          gameBoard[y] = [...gameBoard[y - 1]];
        }

        // Empty the top row
        gameBoard[0] = Array(gameBoard[0].length).fill(CellEmpty.Empty);

        // Check the same row again
        row++;
      }
    }

    return linesCleared;
  }, []);

  /**
   * Calculates the score based on the number of lines cleared
   * and updates the score state
   */
  const calculateScore = useCallback((linesCleared: number): number => {
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
  }, []);

  /**
   * Checks if the game is over by checking if a new block
   * would collide with the board at the starting position
   */
  const checkGameOver = useCallback(
    (block: Block, shape: BlockShape): boolean => {
      return checkBlockCollision(board, shape, 0, 3);
    },
    [board]
  );

  /**
   * Commits the current block position to the board,
   * and sets up the next block to be played
   */
  const commitPosition = useCallback(() => {
    console.log("Committing position at row:", dropRow, "col:", dropCol);

    const newBoard = structuredClone(board);
    setShapeOnBoard(newBoard, dropBlock, dropShape, dropRow, dropCol);

    const linesCleared = clearFullLines(newBoard);
    if (linesCleared > 0) {
      const scoreToAdd = calculateScore(linesCleared);
      setScore((prevScore) => prevScore + scoreToAdd);
    }

    const upcomingBlocks = structuredClone(nextBlocks);
    const newBlock = upcomingBlocks.pop();

    if (upcomingBlocks.length < 3) {
      upcomingBlocks.unshift(getRandomBlock());
    }

    setSpeed(Speed.Normal);
    setNextBlocks(upcomingBlocks);

    const nextBlockToUse = newBlock || getRandomBlock();

    if (checkGameOver(nextBlockToUse, SHAPES[nextBlockToUse].shape)) {
      endGame();
      return;
    }

    dispatchBoardState({
      type: "commit",
      newBoard,
      newBlock: nextBlockToUse,
    });

    setIsCommit(false);
  }, [
    board,
    dropShape,
    dropRow,
    dropCol,
    dropBlock,
    dispatchBoardState,
    nextBlocks,
    clearFullLines,
    calculateScore,
    endGame,
    checkGameOver,
  ]);

  /**
   * Handles the game step logic, moving the block down if possible,
   * detecting collisions and committing the block to the board
   */
  const gameStep = useCallback(() => {
    if (!isPlaying) {
      return;
    }

    if (isCommit) {
      commitPosition();
      return;
    }

    const willCollide = checkBlockCollision(
      board,
      dropShape,
      dropRow + 1,
      dropCol
    );

    if (willCollide) {
      console.log("Collision détectée! Position actuelle:", dropRow, dropCol);
      setSpeed(Speed.Slide);
      setIsCommit(true);
    } else {
      dispatchBoardState({ type: "drop" });
    }

    console.log("Drop position:", dropRow, dropCol);
    console.log("Will collide:", willCollide);
  }, [
    board,
    dropShape,
    dropRow,
    dropCol,
    dispatchBoardState,
    isCommit,
    commitPosition,
    isPlaying,
  ]);

  /**
   * Places the block on the board at the specified position
   * Renders the block on the board by setting the block type
   * on the board at the specified position
   */
  function setShapeOnBoard(
    board: BoardShape,
    dropBlock: Block,
    dropShape: BlockShape,
    dropRow: number,
    dropCol: number
  ) {
    if (!dropShape) {
      console.error("Undefined shape in setShapeOnBoard:", dropBlock);
      return;
    }

    // Iterate through each cell in the block shape
    for (let rowIndex = 0; rowIndex < dropShape.length; rowIndex++) {
      for (
        let colIndex = 0;
        colIndex < dropShape[rowIndex].length;
        colIndex++
      ) {
        if (dropShape[rowIndex][colIndex]) {
          const boardRow = dropRow + rowIndex;
          const boardCol = dropCol + colIndex;
          if (
            boardRow >= 0 &&
            boardRow < board.length &&
            boardCol >= 0 &&
            boardCol < board[0].length
          ) {
            board[boardRow][boardCol] = dropBlock;
          }
        }
      }
    }
  }

  // ==== KEYBOARD CONTROLS FUNCTIONS ====

  /**
   * Moves the current block one column to the left if possible
   * Checks for collisions to prevent moving the block off the board
   */
  const moveLeft = useCallback(() => {
    if (!isPlaying || isCommit || !socket) return;

    const willCollide = checkBlockCollision(
      board,
      dropShape,
      dropRow,
      dropCol - 1
    );

    if (!willCollide) {
      dispatchBoardState({ type: "move", direction: -1 });
      socket.emit("movePiece", "left");
    }
  }, [
    board,
    dropShape,
    dropRow,
    dropCol,
    dispatchBoardState,
    isPlaying,
    isCommit,
    socket,
  ]);

  /**
   * Moves the current block one column to the right if possible
   * Checks for collisions to prevent moving the block off the board
   */
  const moveRight = useCallback(() => {
    if (!isPlaying || isCommit || !socket) return;

    const willCollide = checkBlockCollision(
      board,
      dropShape,
      dropRow,
      dropCol + 1
    );

    if (!willCollide) {
      dispatchBoardState({ type: "move", direction: 1 });
      socket.emit("movePiece", "right");
    }
  }, [
    board,
    dropShape,
    dropRow,
    dropCol,
    dispatchBoardState,
    isPlaying,
    isCommit,
    socket,
  ]);

  /**
   * Rotates the current block shape if possible
   * Checks for collisions to prevent rotating the block off the board
   */
  const rotate = useCallback(() => {
    if (!isPlaying || isCommit || !dropShape || !socket) return;

    const rows = dropShape.length;
    const cols = dropShape[0].length;

    const rotatedShape: BlockShape = Array(cols)
      .fill(null)
      .map(() => Array(rows).fill(false));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        rotatedShape[col][rows - 1 - row] = dropShape[row][col];
      }
    }

    const willCollide = checkBlockCollision(
      board,
      rotatedShape,
      dropRow,
      dropCol
    );

    if (!willCollide) {
      dispatchBoardState({ type: "rotate", newShape: rotatedShape });
      socket.emit("rotatePiece");
    }
  }, [
    board,
    dropShape,
    dropRow,
    dropCol,
    dispatchBoardState,
    isPlaying,
    isCommit,
    socket,
  ]);

  /**
   * Temporarily increases the falling speed when down arrow is pressed.
   * Called on key down event.
   */
  const moveDown = useCallback(() => {
    if (isPlaying && !isCommit) {
      setSpeed(Speed.Faster);
    }
  }, [isPlaying, isCommit]);

  /**
   * Restores normal falling speed when down arrow is released.
   * Called on key up event.
   */
  const releaseDown = useCallback(() => {
    if (isPlaying && !isCommit) {
      setSpeed(Speed.Normal);
    }
  }, [isPlaying, isCommit]);

  /**
   * Makes a "hard drop" - directly moves the piece to the lowest
   * possible position and commits it.
   */
  const hardDrop = useCallback(() => {
    if (!isPlaying || isCommit) return;

    let newRow = dropRow;
    let willCollide = false;

    while (!willCollide) {
      newRow++;
      willCollide = checkBlockCollision(board, dropShape, newRow, dropCol);
    }

    dispatchBoardState({ type: "hardDrop", row: newRow - 1 });
    setIsCommit(true);
  }, [
    board,
    dropShape,
    dropRow,
    dropCol,
    dispatchBoardState,
    isPlaying,
    isCommit,
  ]);

  /**
   * Sets up keyboard event listeners for game controls.
   * Handles both keydown and keyup events for different actions.
   */
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
          moveLeft();
          event.preventDefault();
          break;
        case "ArrowRight":
          moveRight();
          event.preventDefault();
          break;
        case "ArrowUp":
          rotate();
          event.preventDefault();
          break;
        case "ArrowDown":
          moveDown();
          event.preventDefault();
          break;
        case " ":
          hardDrop();
          event.preventDefault();
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        releaseDown();
        event.preventDefault();
      }
    };

    // Event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Clean up event listeners on unmount or when game state changes
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPlaying, moveLeft, moveRight, rotate, moveDown, releaseDown, hardDrop]);

  /**
   * Game loop that runs the game step logic at regular intervals
   * with gameStep function as the callback function
   */
  useRepeatingStep(() => {
    if (!isPlaying) {
      return;
    }
    gameStep();
  }, speed);

  /**
   * Renders the game board with the current block position
   */
  const renderBoard = structuredClone(board);
  if (isPlaying && dropShape) {
    setShapeOnBoard(renderBoard, dropBlock, dropShape, dropRow, dropCol);
  }

  return {
    board: renderBoard,
    isPlaying,
    startGame,
    endGame,
    score,
    nextBlock: nextBlocks.length > 0 ? nextBlocks[nextBlocks.length - 1] : null,
    createRoom,
    roomsList,
    joinRoom,
    socket
  };
}
