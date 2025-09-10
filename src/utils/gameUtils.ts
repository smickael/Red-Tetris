/**
 * Calcule le score en fonction du nombre de lignes supprimées
 */
export function calculateScore(linesCleared: number): number {
  switch (linesCleared) {
    case 1:
      return 100;
    case 2:
      return 300;
    case 3:
      return 500;
    case 4:
      return 800;
    default:
      return 0;
  }
}
import { BoardShape, CellEmpty } from "./types";

/**
 * Supprime les lignes pleines du plateau et retourne le nombre de lignes supprimées
 */
export function clearFullLines(gameBoard: BoardShape): number {
  let linesCleared = 0;
  for (let row = gameBoard.length - 1; row >= 0; row--) {
    const isFull = gameBoard[row].every((cell) => cell !== CellEmpty.Empty);
    if (isFull) {
      linesCleared++;
      for (let y = row; y > 0; y--) {
        gameBoard[y] = [...gameBoard[y - 1]];
      }
      gameBoard[0] = Array(gameBoard[0].length).fill(CellEmpty.Empty);
      row++;
    }
  }
  return linesCleared;
}
import { Block } from "./types";

/**
 * @dev Only for offline development - server should provide blocks in production
 */
export function getRandomBlock(): Block {
  console.warn("Using client-side random block - for offline mode only");
  const blocks = Object.values(Block);
  const randomIndex = Math.floor(Math.random() * blocks.length);
  return blocks[randomIndex] as Block;
}
