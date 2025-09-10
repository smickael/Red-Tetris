import { describe, it, expect } from 'vitest';
import { boardReducer, getEmptyBoard, BoardState } from './boardReducer';
import { Block, SHAPES } from '../utils/types';

describe('boardReducer - pénalité', () => {
  it('ajoute la bonne quantité de lignes de garbage', () => {
    const initialState: BoardState = {
      board: getEmptyBoard(),
      dropRow: 0,
      dropCol: 3,
      dropBlock: Block.I,
      dropShape: SHAPES.I.shape,
    };
    const state = boardReducer(initialState, { type: 'addGarbage', count: 3 });
    expect(state.board[state.board.length - 1].every(cell => cell === 'Garbage')).toBe(true);
    expect(state.board[state.board.length - 2].every(cell => cell === 'Garbage')).toBe(true);
    expect(state.board[state.board.length - 3].every(cell => cell === 'Garbage')).toBe(true);
  });
});
