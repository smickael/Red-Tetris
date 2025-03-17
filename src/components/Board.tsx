import { BoardShape } from "../utils/types";
import { Cell } from "./Cell";

interface Props {
   currentBoard: BoardShape;
}

export function Board({ currentBoard }: Props) {
   return (
      <div className="border border-red-500 select-none m-auto rounded-2xl overflow-hidden">
         {currentBoard.map((row, rowIndex) => (
            <div key={`${rowIndex}`} className="flex">
               {row.map((cell, cellIndex) => (
                  <Cell key={`${rowIndex}-${cellIndex}`} type={cell} />
               ))}
            </div>
         ))}
      </div>
   );
}