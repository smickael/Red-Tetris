// Fin du fichier
import { useReducer } from "react";
import { Block, BlockShape, BoardShape, CellEmpty, SHAPES } from "../utils/types";
import { boardReducer, getEmptyBoard, BoardState, Action } from "./boardReducer";
export { getEmptyBoard };
/**
 * Custom hook that manages the board state.
 * Returns the current board state and a dispatch function to update it.
 */
export function useBoard(): [BoardState, React.Dispatch<Action>] {
  const [boardState, dispatchBoardState] = useReducer(
    boardReducer,
    {
      board: [],
      dropRow: 0,
      dropCol: 0,
      dropBlock: Block.I,
      dropShape: SHAPES.I.shape,
    },
    (emptyState) => ({
      ...emptyState,
      board: getEmptyBoard(),
    })
  );
  return [boardState, dispatchBoardState];
}

/**
 * Checks if a block would collide with board borders or other blocks.
 * Returns true if collision would happen, false if movement is valid.
 */
export function checkBlockCollision(
  board: BoardShape,
  currentShape: BlockShape,
  row: number,
  column: number
): boolean {
  if (!currentShape) {
    console.error("Shape is undefined in checkBlockCollision");
    return true;
  }

  for (let rowIndex = 0; rowIndex < currentShape.length; rowIndex++) {
    for (
      let colIndex = 0;
      colIndex < currentShape[rowIndex].length;
      colIndex++
    ) {
      if (currentShape[rowIndex][colIndex]) {
        const boardRow = row + rowIndex;
        const boardCol = column + colIndex;

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
