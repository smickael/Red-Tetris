// components/ScoreBoard.tsx
import React from "react";

type ScoreBoardProps = {
  myScore: number;
  opponents: Array<{ id: string; score: number }>;
  currentPlayerId?: string;
};

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  myScore,
  opponents,
  currentPlayerId,
}) => {
  return (
    <div className="p-4 bg-lightDavysGrey rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h3>Your Score</h3>
        <div className="text-2xl font-SlussenBold">{myScore}</div>
      </div>

      {opponents.length > 0 && (
        <div className="mt-5">
          <h3>Opponents</h3>
          {opponents.map((opponent) => (
            <div
              key={opponent.id}
              className="flex justify-between items-center mb-2"
            >
              <span>
                Player{" "}
                {opponent.id === currentPlayerId
                  ? "(You)"
                  : opponent.id.slice(0, 4)}
              </span>
              <span>{opponent.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
