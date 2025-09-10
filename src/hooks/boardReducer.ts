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

export type Action =
  | { type: "start"; newBlock: Block }
  | { type: "move"; direction: number }
  | { type: "drop" }
  | { type: "rotate"; newShape: BlockShape }
  | { type: "hardDrop"; row: number }
  | { type: "commit"; newBoard: BoardShape; newBlock: Block }
  | { type: "addGarbage"; count: number };

export function getEmptyBoard(height = HEIGHT): BoardShape {
  return Array(height)
    .fill(null)
    .map(() => Array(WIDTH).fill(CellEmpty.Empty));
}

export function boardReducer(state: BoardState, action: Action): BoardState {
  switch (action.type) {
    case "start":
      return {
        board: getEmptyBoard(),
        dropRow: 0,
        dropCol: 3,
        dropBlock: action.newBlock,
        dropShape: SHAPES[action.newBlock].shape,
      };
    case "move":
      return {
        ...state,
        dropCol: state.dropCol + action.direction,
      };
    case "drop":
      return {
        ...state,
        dropRow: state.dropRow + 1,
      };
    case "rotate":
      return {
        ...state,
        dropShape: action.newShape,
      };
    case "hardDrop":
      return {
        ...state,
        dropRow: action.row,
      };
    case "commit":
      return {
        board: action.newBoard,
        dropRow: 0,
        dropCol: 3,
        dropBlock: action.newBlock,
        dropShape: SHAPES[action.newBlock].shape,
      };
    case "addGarbage": {
      if (action.count <= 0) return state;
      const newBoard = [...state.board];
      for (let i = 0; i < action.count; i++) {
        newBoard.shift();
        newBoard.push(Array(WIDTH).fill("Garbage"));
      }
      return {
        ...state,
        board: newBoard,
      };
    }
    default:
      // TypeScript garantit que toutes les actions sont couvertes, mais fallback de sécurité :
      throw new Error(`Unhandled action: ${(action as Action).type}`);
  }
}
