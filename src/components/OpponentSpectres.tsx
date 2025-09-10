import React from "react";

/**
 * Affiche les spectres adverses sous forme de mini-colonnes.
 * @param opponentSpectres Record<playerId, number[]>
 */
export function OpponentSpectres({ opponentSpectres }: { opponentSpectres: Record<string, number[]> }) {
  if (!opponentSpectres || Object.keys(opponentSpectres).length === 0) {
    return <div>Aucun spectre adverse</div>;
  }
  return (
    <div>
      <h3>Spectres adverses</h3>
      <div style={{ display: "flex", gap: 16 }}>
        {Object.entries(opponentSpectres).map(([playerId, spectre]) => (
          <div key={playerId} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, marginBottom: 2 }}>Joueur {playerId.slice(0, 5)}</div>
            <div style={{ display: "flex", alignItems: "flex-end", height: 60 }}>
              {spectre.map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 48,
                    display: "flex",
                    alignItems: "flex-end",
                    margin: "0 1px",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: Math.max(0, Math.min(48, h * 2)),
                      background: "#888",
                      border: "1px solid #ccc",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
