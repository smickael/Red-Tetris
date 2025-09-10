import { useCallback, useState, useEffect } from "react";
import { checkBlockCollision, useBoard } from "./useBoard";
import { useRepeatingStep } from "./useRepeatingStep";
import {
  Block,
  BlockShape,
  BoardShape,
  CellEmpty,
  Room,
  SHAPES,
  Speed,
} from "../utils/types";
import { useSocket } from "../useSocket";
import { toast } from "sonner";

export function useTetris() {
  const socket = useSocket();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed | null>(null);
  const [isCommit, setIsCommit] = useState(false);
  const [nextBlocks, setNextBlocks] = useState<Block[]>([]);
  const [score, setScore] = useState(0);
  const [roomsList, setRoomsList] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [currentRoomPlayers, setCurrentRoomPlayers] = useState<string[]>([]);

  const [
    { board, dropRow, dropCol, dropBlock, dropShape },
    dispatchBoardState,
  ] = useBoard();

  // Insert n garbage lines (indestructible) at the bottom, pushing the board up
  const addGarbageLines = useCallback(
    (gameBoard: BoardShape, n: number) => {
      if (n <= 0) return;
      const width = gameBoard[0]?.length || 10;
      for (let i = 0; i < n; i++) {
        gameBoard.shift();
        gameBoard.push(Array(width).fill("Garbage" as any));
      }
    },
    []
  );

  useEffect(() => {
    if (!socket) return;

    const handleStartedGame = (initialBlocks: Block[]) => {
      // FIFO: first element is current block, rest is the queue
      const [first, ...rest] = initialBlocks;
      setNextBlocks(rest);
      setIsPlaying(true);
      setSpeed(Speed.Normal);
      setScore(0);
      toast.success("La partie démarre");
      dispatchBoardState({ type: "start", newBlock: first });
    };

  const handleRoomsList = (rooms: string) => {
      console.log("Received rooms list:", rooms);
      setRoomsList(JSON.parse(rooms));
    };

    const handlePieceMoved = (newBoard: BoardShape) => {
      dispatchBoardState({ type: "commit", newBoard });
    };

    const handleNewBlock = (newBlock: Block) => {
      // FIFO: append to the end
      setNextBlocks((prev) => [...prev, newBlock]);
    };

    const handleHostChanged = (newHostId: string, roomId: string) => {
      const isMe = socket.id === newHostId;
      toast.info(isMe ? "Vous êtes maintenant l’hôte." : "Transfert d’hôte effectué.");
      if (currentRoom && currentRoom !== roomId) {
        setCurrentRoom(roomId);
      }
    };

    const handleNotHost = () => {
      toast.error("Seul l’hôte peut démarrer la partie.");
    };

    socket.on("gameStarted", handleStartedGame);
    socket.on("roomsList", handleRoomsList);
    socket.on("pieceMoved", handlePieceMoved);
    socket.on("newBlock", handleNewBlock);
    socket.on("hostChanged", handleHostChanged);
    socket.on("notHost", handleNotHost);
  socket.on("roomLocked", () => toast.error("Partie déjà en cours"));
    socket.on("roomCreated", (room: Room) => {
      toast.success(`Room "${room.roomName}" créée`);
      setCurrentRoom(room.id);
      setCurrentRoomPlayers(room.players || []);
    });
    socket.on("joinedRoom", (room: Room) => {
      toast.success(`Rejoint la room "${room.roomName}"`);
      setCurrentRoom(room.id);
      setCurrentRoomPlayers(room.players || []);
    });
    socket.on("playerJoined", (playerId: string) => {
      setCurrentRoomPlayers((p) => Array.from(new Set([...(p || []), playerId])));
      toast.info(`Un joueur a rejoint (${playerId.slice(0, 5)})`);
    });
    socket.on("playerLeft", (playerId: string) => {
      setCurrentRoomPlayers((p) => (p || []).filter((id) => id !== playerId));
      toast.info(`Un joueur a quitté (${playerId.slice(0, 5)})`);
    });

    socket.on("addGarbage", (n: number) => {
      // TODO: appliquer les lignes sans casser la pièce courante
      // Pour l’instant, on notifie seulement pour éviter de désynchroniser la séquence
      toast.warning(`${n} ligne(s) de pénalité ajoutée(s)`);
    });

    socket.emit("getRooms");

    return () => {
      socket.off("gameStarted", handleStartedGame);
      socket.off("roomsList", handleRoomsList);
      socket.off("pieceMoved", handlePieceMoved);
    socket.off("newBlock", handleNewBlock);
  socket.off("hostChanged", handleHostChanged);
    socket.off("notHost", handleNotHost);
    socket.off("roomCreated");
    socket.off("joinedRoom");
  socket.off("playerJoined");
  socket.off("playerLeft");
    };
  }, [socket, dispatchBoardState, currentRoom, board, addGarbageLines, dropBlock]);

  const createRoom = useCallback(
    (roomName: string) => {
      if (socket) {
        socket.emit("createRoom", roomName);
        setCurrentRoom(socket.id ?? null);
      }
    },
    [socket]
  );

  const joinRoom = useCallback(
    (room: Room) => {
      if (socket) {
        socket.emit("joinRoom", room.id);
        setCurrentRoom(room.id);
      }
    },
    [socket]
  );

  const leaveRoom = useCallback(() => {
    if (!socket || !currentRoom) return;
    socket.emit("leaveRoom", currentRoom);
    setCurrentRoom(null);
    setCurrentRoomPlayers([]);
    toast("Vous avez quitté la room");
  }, [socket, currentRoom]);

  /**
   * Start a new game by setting up the first blocks
   * and starting the game loop
   */
  const startGame = useCallback(() => {
    if (!socket) {
      // Mode solo sans socket (fallback) – generate random pieces locally
      const blocks = Object.values(Block) as Block[];
      const rand = () => blocks[Math.floor(Math.random() * blocks.length)];
      const initialBlocks: Block[] = [rand(), rand(), rand()];
      const [first, ...rest] = initialBlocks;
      setNextBlocks(rest);
      setIsPlaying(true);
      setSpeed(Speed.Normal);
      setScore(0);
      toast.success("La partie démarre");
      dispatchBoardState({ type: "start", newBlock: first });
      return;
    }

    // Avec socket (mode solo ou multi)
    socket.emit("startGame");

    // Reset some states while waiting for server response
    setSpeed(null);
  }, [socket, dispatchBoardState]);

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
  const checkGameOver = useCallback((_: Block, shape: BlockShape): boolean => {
    return checkBlockCollision(board, shape, 0, 3);
  }, [board]);

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
      socket?.emit("linesCleared", linesCleared);
    }

  const upcomingBlocks = structuredClone(nextBlocks);
  const newBlock = upcomingBlocks.shift();

    if (upcomingBlocks.length < 3) {
      if (socket) {
        socket.emit("requestNewBlock");
      } else {
        // Offline/solo: generate a local random block and append
        const blocks = Object.values(Block) as Block[];
        const localNew = blocks[Math.floor(Math.random() * blocks.length)];
        upcomingBlocks.push(localNew);
      }
    }

  setSpeed(Speed.Normal);
  setNextBlocks(upcomingBlocks);

    let nextBlockToUse = newBlock as Block | undefined;
    if (!nextBlockToUse) {
      // If queue was empty, try to get one now (socket will arrive async), else local random
      const blocks = Object.values(Block) as Block[];
      nextBlockToUse = blocks[Math.floor(Math.random() * blocks.length)];
    }

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
    socket,
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
  if (!isPlaying || isCommit) return;

    const willCollide = checkBlockCollision(
      board,
      dropShape,
      dropRow,
      dropCol - 1
    );

    if (!willCollide) {
      dispatchBoardState({ type: "move", direction: -1 });
      socket?.emit("movePiece", "left");
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
  if (!isPlaying || isCommit) return;

    const willCollide = checkBlockCollision(
      board,
      dropShape,
      dropRow,
      dropCol + 1
    );

    if (!willCollide) {
      dispatchBoardState({ type: "move", direction: 1 });
      socket?.emit("movePiece", "right");
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
  if (!isPlaying || isCommit || !dropShape) return;

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
      socket?.emit("rotatePiece");
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
  socket?.emit("dropPiece");
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
    nextBlock: nextBlocks.length > 0 ? nextBlocks[0] : null,
    createRoom,
    roomsList,
    joinRoom,
  leaveRoom,
    socket,
    currentRoom,
  currentRoomPlayers,
  };
}
