import { useCallback, useState, useEffect } from "react";
import { checkBlockCollision, getRandomBlock, useBoard } from "./useBoard";
import { useRepeatingStep } from "./useRepeatingStep";
import { Block, BlockShape, BoardShape } from "../utils/types";

enum Speed {
  Normal = 800,
  Fast = 400,
  Faster = 200,
  Slide = 100,
}

export function useTetris() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed | null>(null);
  const [isCommit, setIsCommit] = useState(false);
  const [nextBlocks, setNextBlocks] = useState<Block[]>([]);

  const [
    { board, dropRow, dropCol, dropBlock, dropShape },
    dispatchBoardState,
  ] = useBoard();

  const startGame = useCallback(() => {
    const firstBlocks = [getRandomBlock(), getRandomBlock(), getRandomBlock()];
    setNextBlocks(firstBlocks);
    setIsPlaying(true);
    setSpeed(Speed.Normal);
    dispatchBoardState({ type: "start" });
  }, [dispatchBoardState]);

  const commitPosition = useCallback(() => {
    console.log("Committing position at row:", dropRow, "col:", dropCol);

    const newBoard = structuredClone(board);
    setShapeOnBoard(newBoard, dropBlock, dropShape, dropRow, dropCol);

    const upcomingBlocks = structuredClone(nextBlocks);
    const newBlock = upcomingBlocks.pop();

    if (upcomingBlocks.length < 3) {
      upcomingBlocks.unshift(getRandomBlock());
    }

    setSpeed(Speed.Normal);
    setNextBlocks(upcomingBlocks);

    const nextBlockToUse = newBlock || getRandomBlock();

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
  ]);

  const gameStep = useCallback(() => {
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
  ]);

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
            // Placer le bloc sur le plateau
            board[boardRow][boardCol] = dropBlock;
          }
        }
      }
    }
  }

  const moveLeft = useCallback(() => {
    const willCollide = checkBlockCollision(
      board,
      dropShape,
      dropRow,
      dropCol - 1
    );
    if (!willCollide && isPlaying && !isCommit) {
      dispatchBoardState({ type: "move", direction: -1 });
    }
  }, [
    board,
    dropShape,
    dropRow,
    dropCol,
    dispatchBoardState,
    isPlaying,
    isCommit,
  ]);

  const moveRight = useCallback(() => {
    const willCollide = checkBlockCollision(
      board,
      dropShape,
      dropRow,
      dropCol + 1
    );
    if (!willCollide && isPlaying && !isCommit) {
      dispatchBoardState({ type: "move", direction: 1 });
    }
  }, [
    board,
    dropShape,
    dropRow,
    dropCol,
    dispatchBoardState,
    isPlaying,
    isCommit,
  ]);

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
    }
  }, [
    board,
    dropShape,
    dropRow,
    dropCol,
    dispatchBoardState,
    isPlaying,
    isCommit,
  ]);

  const moveDown = useCallback(() => {
    if (isPlaying && !isCommit) {
      setSpeed(Speed.Faster);
    }
  }, [isPlaying, isCommit]);

  const releaseDown = useCallback(() => {
    if (isPlaying) {
      setSpeed(Speed.Normal);
    }
  }, [isPlaying]);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isPlaying) return;

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
        case " ": // Spacebar
          hardDrop();
          event.preventDefault();
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!isPlaying) return;

      switch (event.key) {
        case "ArrowDown":
          releaseDown();
          event.preventDefault();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPlaying, moveLeft, moveRight, rotate, moveDown, releaseDown, hardDrop]);

  useRepeatingStep(() => {
    if (!isPlaying) {
      return;
    }
    gameStep();
  }, speed);

  const renderBoard = structuredClone(board);
  if (isPlaying && dropShape) {
    setShapeOnBoard(renderBoard, dropBlock, dropShape, dropRow, dropCol);
  }

  return {
    board: renderBoard,
    isPlaying,
    startGame,
    nextBlock: nextBlocks.length > 0 ? nextBlocks[nextBlocks.length - 1] : null,
  };
}
