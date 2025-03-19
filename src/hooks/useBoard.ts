import { Dispatch, useReducer } from "react";
import {
  Block,
  BlockShape,
  BoardShape,
  CellEmpty,
  SHAPES,
} from "../utils/types";

export const WIDTH = 10;
export const HEIGHT = 20;

export type BoardState = {
  board: BoardShape;
  dropRow: number;
  dropCol: number;
  dropBlock: Block;
  dropShape: BlockShape;
};

export type Action = {
  type: "start" | "move" | "drop" | "commit" | "rotate" | "hardDrop";
  newBoard?: BoardShape;
  newBlock?: Block;
  direction?: number;
  newShape?: BlockShape;
  row?: number;
};

export function getRandomBlock(): Block {
  const blocks = Object.values(Block);
  const randomIndex = Math.floor(Math.random() * blocks.length);
  return blocks[randomIndex] as Block;
}

export function getEmptyBoard(height = HEIGHT): BoardShape {
  return Array(height)
    .fill(null)
    .map(() => Array(WIDTH).fill(CellEmpty.Empty));
}

function boardReducer(state: BoardState, action: Action): BoardState {
  let _state = { ...state };

  switch (action.type) {
    case "start":
      const startBlock: Block = getRandomBlock();
      return {
        board: getEmptyBoard(),
        dropRow: 0,
        dropCol: 3,
        dropBlock: startBlock,
        dropShape: SHAPES[startBlock].shape,
      };
    case "move":
      if (action.direction !== undefined) {
        _state.dropCol += action.direction;
      }
      break;
    case "drop":
      _state.dropRow++;
      break;
    case "rotate":
      if (action.newShape) {
        _state.dropShape = action.newShape;
      }
      break;
    case "hardDrop":
      if (action.row !== undefined) {
        _state.dropRow = action.row;
      }
      break;
    case "commit":
      if (!action.newBoard) {
        throw new Error("Missing newBoard in commit action");
      }

      const nextBlock = action.newBlock || getRandomBlock();
      return {
        board: action.newBoard,
        dropRow: 0,
        dropCol: 3,
        dropBlock: nextBlock,
        dropShape: SHAPES[nextBlock].shape,
      };
    default:
      const unhandledAction: never = action.type;
      throw new Error(`Unhandled action: ${unhandledAction}`);
  }

  return _state;
}

export function useBoard(): [BoardState, Dispatch<Action>] {
  const [boardState, dispatchBoardState] = useReducer(
    boardReducer,
    {
      board: [],
      dropRow: 0,
      dropCol: 0,
      dropBlock: Block.I,
      dropShape: SHAPES.I.shape,
    },
    (emptyState) => {
      const state = {
        ...emptyState,
        board: getEmptyBoard(),
      };
      return state;
    }
  );
  return [boardState, dispatchBoardState];
}

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
