import { renderHook, act } from '@testing-library/react';
// Vitest globals
import { describe, it, expect } from 'vitest';
import { useTetris } from './useTetris';
import { SocketContext } from '../components/SocketProvider';
import { Block } from '../utils/types';

// Fournit un contexte socket null pour forcer le mode solo
function renderSolo() {
  return renderHook(() => useTetris(), {
    wrapper: ({ children }) => (
      <SocketContext.Provider value={{ socket: null }}>{children}</SocketContext.Provider>
    )
  });
}

describe('useTetris solo mode', () => {
  it('starts a solo game with a 7-bag queue of at least 2 blocks', () => {
    const { result } = renderSolo();
    act(() => {
      result.current.startSoloGame();
    });
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.nextBlocksPreview.length).toBeGreaterThanOrEqual(2);
    // Vérifie que les blocks sont valides
    result.current.nextBlocksPreview.forEach(b => {
      expect(Object.values(Block)).toContain(b);
    });
  });
});
