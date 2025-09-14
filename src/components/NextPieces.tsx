import { Block, SHAPES, BLOCK_COLORS } from "../utils/types";

export type NextPiecesProps = {
  nextBlocks: Block[];
};

export function NextPieces({ nextBlocks }: NextPiecesProps) {
  return (
    <div className="flex flex-col items-center gap-2 w-44">
      {Array.isArray(nextBlocks) && nextBlocks.length > 0 &&
        <h3 className="text-xs text-davysGrey mb-1">Prochaines pièces</h3>}
      {nextBlocks.slice(0, 3).map((block, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <span className="text-xs font-bold mb-1">{block}</span>
          <div style={{ display: "inline-block", padding: 2, borderRadius: 4 }}>
            {SHAPES[block].shape.map((row, i) => (
              <div key={i} style={{ display: "flex" }}>
                {row.map((cell, j) => (
                  <div
                    key={j}
                    style={{
                      width: 40,
                      height: 40,
                      background: cell ? BLOCK_COLORS[block] : "transparent",
                      borderRadius: 8,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
