import { describe, it, expect } from 'vitest';
import { boardReducer, getEmptyBoard, BoardState } from './boardReducer';
import { Block, SHAPES } from '../utils/types';


describe('boardReducer', () => {
  it('démarre une partie avec start', () => {
    const initialState: BoardState = {
      board: getEmptyBoard(),
      dropRow: 0,
      dropCol: 3,
      dropBlock: Block.I,
      dropShape: SHAPES.I.shape,
    };
    const state = boardReducer(initialState, { type: 'start', newBlock: Block.T });
    expect(state.dropBlock).toBe(Block.T);
    expect(state.dropRow).toBe(0);
    expect(state.dropCol).toBe(3);
  });

  it('ajoute des lignes de garbage', () => {
    const initialState: BoardState = {
      board: getEmptyBoard(),
      dropRow: 0,
      dropCol: 3,
      dropBlock: Block.I,
      dropShape: SHAPES.I.shape,
    };
    const state = boardReducer(initialState, { type: 'addGarbage', count: 2 });
    expect(state.board[state.board.length - 1].every(cell => cell === 'Garbage')).toBe(true);
    expect(state.board[state.board.length - 2].every(cell => cell === 'Garbage')).toBe(true);
  });
});
