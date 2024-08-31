import { Dispatch, useReducer } from "react";
import {
  Block,
  BlockShape,
  BoardShape,
  CellEmpty,
  SHAPES,
} from "../utils/types";

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
  type: "start" | "move" | "rotate" | "drop" | "gameover";
};

export function getRandomBlock(): Block {
  const blocks = Object.values(Block);
  const randomIndex = Math.floor(Math.random() * blocks.length);
  return blocks[randomIndex];
}

export function getEmptyBoard(): BoardShape {
  return Array(20)
    .fill(null)
    .map(() => Array(10).fill(CellEmpty.Empty));
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
        // currentBlockPosition: { x: 0, y: 0 },
        // currentBlockRotation: 0,
        // nextBlock: Block.J,
        // score: 0,
        // isGameOver: false,
      };
    case "move":
      return state;
    case "rotate":
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
