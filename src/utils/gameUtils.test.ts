import { describe, it, expect } from 'vitest';
import { clearFullLines } from './gameUtils';

describe('clearFullLines', () => {
  it('supprime une ligne pleine', () => {
    const board = [
      ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'],
      ...Array(19).fill(Array(10).fill('Empty')),
    ];
    const copy = board.map(row => [...row]);
    const cleared = clearFullLines(copy);
    expect(cleared).toBe(1);
    expect(copy[0].every(cell => cell === 'Empty')).toBe(true);
  });
});
