import { Block, SHAPES, BLOCK_COLORS } from "../utils/types";

export type NextPiecesProps = {
  nextBlocks: Block[];
};

export function NextPieces({ nextBlocks }: NextPiecesProps) {
  if (!nextBlocks || nextBlocks.length === 0) {
    return <div>Aucune pièce à venir</div>;
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <h3 className="text-xs text-davysGrey mb-1">Prochaines pièces</h3>
      {nextBlocks.slice(0, 3).map((block, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <span className="text-xs font-bold mb-1">{block}</span>
          <div style={{ display: "inline-block", background: "#eee", padding: 2, borderRadius: 4 }}>
            {SHAPES[block].shape.map((row, i) => (
              <div key={i} style={{ display: "flex" }}>
                {row.map((cell, j) => (
                  <div
                    key={j}
                    style={{
                      width: 10,
                      height: 10,
                      background: cell ? BLOCK_COLORS[block] : "#fff",
                      border: cell ? "1px solid #888" : "1px solid #eee",
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
