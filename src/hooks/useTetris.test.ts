import { describe, it, expect } from 'vitest';
import { calculateScore } from '../utils/gameUtils';

describe('calculateScore', () => {
  it('retourne le bon score pour 1 à 4 lignes', () => {
    expect(calculateScore(1)).toBe(100);
    expect(calculateScore(2)).toBe(300);
    expect(calculateScore(3)).toBe(500);
    expect(calculateScore(4)).toBe(800);
    expect(calculateScore(0)).toBe(0);
    expect(calculateScore(5)).toBe(0);
  });
});
