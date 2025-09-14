import { useCallback, useState, useEffect, useRef } from "react";

import { checkBlockCollision, useBoard } from "./useBoard";
import { clearFullLines, calculateScore } from "../utils/gameUtils";
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
import { useSocket } from "./useSocket";
import { toast } from "sonner";


export function useTetris() {
  // Pour feedback visuel lors de pénalité
  const [penaltyFlash, setPenaltyFlash] = useState(false);
  // Stockage des spectres adverses (playerId -> tableau de hauteurs)
  const [opponentSpectres, setOpponentSpectres] = useState<Record<string, number[]>>({});

  const socket = useSocket();
  const [isPlaying, setIsPlaying] = useState(false);
  // Indique si la partie actuelle est en mode solo local (pas de serveur)
  const [isSolo, setIsSolo] = useState(false);
  const [speed, setSpeed] = useState<Speed | null>(null);
  const [isCommit, setIsCommit] = useState(false);
  const [nextBlocks, setNextBlocks] = useState<Block[]>([]);
  // Pour le mode solo : gestion d'un sac (7-bag) afin d'avoir une distribution équitable
  const soloBagRef = useRef<Block[]>([]);

  const refillSoloBag = useCallback(() => {
    // Génère un 7-bag mélangé
    const bag = Object.values(Block) as Block[];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    soloBagRef.current.push(...bag);
  }, []);

  const getNextSoloBlock = useCallback((): Block => {
    if (soloBagRef.current.length === 0) refillSoloBag();
    const b = soloBagRef.current.shift();
    if (!b) {
      // Sécurité extrême
      refillSoloBag();
      return soloBagRef.current.shift() as Block;
    }
    return b;
  }, [refillSoloBag]);
  const [score, setScore] = useState(0);
  const [roomsList, setRoomsList] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [currentRoomPlayers, setCurrentRoomPlayers] = useState<string[]>([]);
  const [currentRoomHost, setCurrentRoomHost] = useState<string | null>(null);
  // Pour affichage du vainqueur
  const [winner, setWinner] = useState<string | null>(null);

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
        gameBoard.push(Array(width).fill("Garbage"));
      }
    },
    []
  );

  useEffect(() => {

    // Réception des spectres adverses
    if (!socket) return;
    socket.on("spectresUpdate", (spectres: Record<string, number[]>) => {
      // On retire notre propre spectre si possible
      if (socket && socket.id) {
        delete spectres[socket.id];
      }
      setOpponentSpectres(spectres);
    });

    // Gestion du fallback offline : détection de la déconnexion socket
    if (!socket) {
      // Si le socket est null, on passe en mode solo local
      if (isPlaying) {
        toast.error("Déconnecté du serveur, passage en mode solo");
      }
      return;
    }
    // Écoute la déconnexion du socket
    socket.on("disconnect", () => {
      toast.error("Connexion au serveur perdue. Passage en mode solo.");
      setCurrentRoom(null);
      setCurrentRoomPlayers([]);
      // On ne touche pas à isPlaying pour laisser la partie continuer en local
    });

    // Écoute la reconnexion
    socket.on("connect", () => {
      toast.success("Reconnexion au serveur");
      // Optionnel : proposer de rejoindre une room ou resynchroniser
    });

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
      // Il manque newBlock ici, on va utiliser le block courant
      dispatchBoardState({ type: "commit", newBoard, newBlock: dropBlock });
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
      setCurrentRoomHost(newHostId);
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
      setCurrentRoomHost(room.host || socket.id || null);
    });
    socket.on("joinedRoom", (room: Room) => {
      toast.success(`Rejoint la room "${room.roomName}"`);
      setCurrentRoom(room.id);
      setCurrentRoomPlayers(room.players || []);
      setCurrentRoomHost(room.host || null);
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
      toast.warning(`${n} ligne(s) de pénalité ajoutée(s)`);
      setPenaltyFlash(true);
      setTimeout(() => setPenaltyFlash(false), 300);
      dispatchBoardState({ type: "addGarbage", count: n });
    });

    // Gestion de la fin de partie multi
    socket.on("gameOver", ({ winner: winId }) => {
      setIsPlaying(false);
      setSpeed(null);
      setWinner(winId || null);
      if (winId === socket.id) {
        toast.success("Félicitations, vous êtes le vainqueur !");
      } else if (winId) {
        toast.error("Partie terminée. Le vainqueur est : " + winId.slice(0, 5));
      } else {
        toast("Partie terminée. Aucun vainqueur.");
      }
    });

    socket.emit("getRooms");



    return () => {
      if (!socket) return;
      socket.off("spectresUpdate");
      socket.off("disconnect");
      socket.off("connect");
      socket.off("gameStarted", handleStartedGame);
      socket.off("roomsList", handleRoomsList);
      socket.off("pieceMoved", handlePieceMoved);
      socket.off("newBlock", handleNewBlock);
      socket.off("hostChanged", handleHostChanged);
      socket.off("notHost", handleNotHost);
      socket.off("roomLocked");
      socket.off("roomCreated");
      socket.off("joinedRoom");
      socket.off("playerJoined");
      socket.off("playerLeft");
      socket.off("addGarbage");
      socket.off("gameOver");
    };
  }, [socket, dispatchBoardState, currentRoom, board, addGarbageLines, dropBlock, isPlaying]);

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
    setCurrentRoomHost(null);
    toast("Vous avez quitté la room");
  }, [socket, currentRoom]);

  /**
   * Start a new game by setting up the first blocks
   * and starting the game loop
   */
  const startSoloGame = useCallback(() => {
    setIsSolo(true);
    setScore(0);
    setWinner(null);
    soloBagRef.current = [];
    // Réinitialisations d'état spécifiques
    setIsCommit(false); // éviter commit immédiat si ancienne partie finissait en phase de slide
    setPenaltyFlash(false);
    // Pré-charger 3 blocks d'avance pour cohérence avec logique commit
    const first = getNextSoloBlock();
    const queue: Block[] = [getNextSoloBlock(), getNextSoloBlock(), getNextSoloBlock()];
    setNextBlocks(queue);
    setIsPlaying(true);
    setSpeed(Speed.Normal);
    toast.success("Solo: la partie démarre");
    dispatchBoardState({ type: "start", newBlock: first });
  }, [dispatchBoardState, getNextSoloBlock]);

  const startGame = useCallback(() => {
    if (!socket) {
      // Pas de socket -> lancer directement le mode solo
      startSoloGame();
      return;
    }
    setIsSolo(false);
    socket.emit("startGame");
    setSpeed(null);
  }, [socket, startSoloGame]);

  /**
   * Ends the current game when it's game over
   */
  const endGame = useCallback(() => {
    setIsPlaying(false);
    setSpeed(null);
    console.log("Game over. Score:", score);
    // Si on est en multi, signaler la défaite au serveur
    if (socket && currentRoom) {
      socket.emit("playerLost");
    }
  }, [score, socket, currentRoom]);

  /**
   * Checks if the board has any full lines and clears them
   * Returns the number of lines cleared for the score
   */
  // clearFullLines déplacé dans utils/gameUtils.ts

  /**
   * Calculates the score based on the number of lines cleared
   * and updates the score state
   */
  // calculateScore déplacé dans utils/gameUtils.ts

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

    // Gestion de la séquence de blocks :
    const upcomingBlocks = structuredClone(nextBlocks);
    let newBlock: Block | undefined = undefined;

    // Toujours maintenir au moins 3 blocks d'avance
    if (!socket || isSolo) {
      // Mode solo : on garantit 3 blocks d'avance via 7-bag
      while (upcomingBlocks.length < 3) {
        upcomingBlocks.push(getNextSoloBlock());
      }
      newBlock = upcomingBlocks.shift();
    } else {
      // Mode multi avec serveur
      while (upcomingBlocks.length < 3) {
        socket.emit("requestNewBlock");
        break; // éviter spam
      }
      if (upcomingBlocks.length < 1) {
        setSpeed(Speed.Normal);
        setIsCommit(false);
        return;
      }
      newBlock = upcomingBlocks.shift();
    }

    setSpeed(Speed.Normal);
    setNextBlocks(upcomingBlocks);

    if (!newBlock) {
      // Sécurité : on ne peut pas continuer sans block
      toast.error("Erreur de synchronisation des blocks (désync)");
      setIsPlaying(false);
      setSpeed(null);
      setWinner(null);
      return;
    }

    if (checkGameOver(newBlock, SHAPES[newBlock].shape)) {
      endGame();
      return;
    }

    dispatchBoardState({
      type: "commit",
      newBoard,
      newBlock: newBlock,
    });

    setIsCommit(false);

    // Envoi du spectre au serveur (pour le rendu en temps réel des adversaires)
    if (!isSolo && socket && currentRoom) {
      // Calcul du spectre : hauteur de chaque colonne
      const heights = Array(newBoard[0].length).fill(0);
      for (let col = 0; col < newBoard[0].length; col++) {
        for (let row = 0; row < newBoard.length; row++) {
          if (newBoard[row][col] !== CellEmpty.Empty) {
            heights[col] = newBoard.length - row;
            break;
          }
        }
      }
      socket.emit("updateSpectre", heights);
    }
  }, [
    board,
    dropShape,
    dropRow,
    dropCol,
    dropBlock,
    dispatchBoardState,
    nextBlocks,
    endGame,
    checkGameOver,
    socket,
    currentRoom,
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

  // Gestion de la reconnexion socket (doit être placée juste avant le return)
  useEffect(() => {
    if (!socket || !currentRoom) return;
    // Si le socket se reconnecte, on tente de resynchroniser la séquence
    socket.emit("reconnectToRoom");

    type ReconnectPayload = { nextBlocks: Block[]; board?: BoardShape; score?: number; spectre?: number[] };
    const handleReconnected = (payload: ReconnectPayload) => {
      if (!payload || !payload.nextBlocks || payload.nextBlocks.length < 1) {
        toast.error("Erreur de reconnexion : séquence invalide");
        return;
      }
      const [first, ...rest] = payload.nextBlocks;
      setNextBlocks(rest);
      setIsPlaying(true);
      setSpeed(Speed.Normal);
      setScore(payload.score || 0);
      toast.success("Reconnexion réussie, partie reprise");
      if (payload.board) {
        dispatchBoardState({ type: "commit", newBoard: payload.board, newBlock: first });
      } else {
        dispatchBoardState({ type: "start", newBlock: first });
      }
    };
    socket.on("reconnected", handleReconnected);
    socket.on("reconnectFailed", (msg: string) => {
      toast.error(msg || "Impossible de se reconnecter à la partie");
    });
    return () => {
      socket.off("reconnected", handleReconnected);
      socket.off("reconnectFailed");
    };
  }, [socket, currentRoom, dispatchBoardState]);

  return {
    board: renderBoard,
    isPlaying,
    startGame,
    startSoloGame,
    endGame,
    score,
    nextBlock: nextBlocks.length > 0 ? nextBlocks[0] : null,
    nextBlocksPreview: nextBlocks.slice(0, 3),
    createRoom,
    roomsList,
    joinRoom,
    leaveRoom,
    socket,
    currentRoom,
    currentRoomPlayers,
    currentRoomHost,
    opponentSpectres,
    penaltyFlash,
    winner,
    isSolo,
  };
}
