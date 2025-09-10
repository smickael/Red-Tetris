import { describe, it, expect } from 'vitest';
import { getEmptyBoard } from './useBoard';

// Test simple sur le board vide

describe('getEmptyBoard', () => {
  it('crée un plateau vide de 20x10', () => {
    const board = getEmptyBoard();
    expect(board.length).toBe(20);
    expect(board[0].length).toBe(10);
    expect(board.flat().every(cell => cell === 'Empty')).toBe(true);
  });
});
