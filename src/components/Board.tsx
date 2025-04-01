import { BoardShape } from "../utils/types";
import { Cell } from "./Cell";

interface Props {
  currentBoard: BoardShape;
}

export function Board({ currentBoard }: Props) {
  return (
    <div className="w-fit flex flex-col items-center gap-4 my-4">
      <h1 className="font-SlussenBold uppercase tracking-tighter text-2xl">
        tetris
      </h1>
      <div className="w-fit border-8 border-davysGrey select-none m-auto rounded-2xl overflow-hidden">
        {currentBoard.map((row, rowIndex) => (
          <div key={`${rowIndex}`} className="flex">
            {row.map((cell, cellIndex) => (
              <Cell key={`${rowIndex}-${cellIndex}`} type={cell} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
