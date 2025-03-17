import "./App.css";
import { Board } from "./components/Board";
import { useTetris } from "./hooks/useTetris";

function App() {
  const { board, startGame, isPlaying } = useTetris();
  return (
    <> 
      <Board currentBoard={board} />
      <div className="controls">
        <button onClick={startGame}>{isPlaying ? "Stop" : "Start"}</button>
      </div>
    </>
  );
}

export default App;
