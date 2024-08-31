import { useCallback, useState } from "react";
import { useBoard } from "./useBoard";

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

  const gameStep = useCallback(() => {
    dispatchBoardState({ type: "drop" });
  }, [dispatchBoardState]);

  useRepeatingStep(() => {
    gameStep();
  }, speed);
}
