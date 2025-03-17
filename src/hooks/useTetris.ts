import { useCallback, useState } from "react";
import { useBoard } from "./useBoard";
import { useRepeatingStep } from "./useRepeatingStep";

enum Speed {
  Normal = 800,
  Fast = 400,
  Faster = 200,
}

export function useTetris() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed | null>(null);

  const [
    { board, dropRow, dropCol, dropBlock, dropShape },
    dispatchBoardState,
  ] = useBoard();

  const startGame = useCallback(() => {
    setIsPlaying(true);
    setSpeed(Speed.Normal);
    dispatchBoardState({ type: "start" });
  }, [dispatchBoardState]);

  const gameStep = useCallback(() => {
    dispatchBoardState({ type: "drop" });
  }, [dispatchBoardState]);

  const renderBoard = structuredClone(board);
  if (isPlaying) {
    dropShape
      .filter((row) => row.some((cell) => cell))
      .forEach((row: boolean[], rowIndex: number) => {
        row.forEach((cell: boolean, colIndex: number) => {
          if (cell) {
            renderBoard[dropRow + rowIndex][dropCol + colIndex] = dropBlock;
          }
        });
      });
  }

  useRepeatingStep(() => {
    if (!isPlaying) {
      return;
    }
    gameStep();
  }, speed);

  return {
    board: renderBoard,
    isPlaying,
    startGame,
    // setSpeed,
  };
}
