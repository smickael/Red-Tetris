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
