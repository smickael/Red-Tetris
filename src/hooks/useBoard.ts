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
//   currentBlockPosition: { x: number; y: number };
//   currentBlockRotation: number;
//   nextBlock: Block;
//   score: number;
//   isGameOver: boolean;
};

export type Action = {
  type: "start" | "move" | "drop" | "gameover";
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
    let _state = {...state};

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
      return state;
    case "drop":
      _state.dropRow++;
      break;
    case "gameover":
      return state;
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
