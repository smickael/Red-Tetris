import { useCallback, useState } from "react";
import { SocketProvider } from "./components/SocketProvider";
import "./App.css";
import { Board } from "./components/Board";
import { useTetris } from "./hooks/useTetris";
import { OpponentSpectres } from "./components/OpponentSpectres";
import { NextPieces } from "./components/NextPieces";
import Button from "./components/Button";
import Input from "./components/Input";

function AppContent() {
  const [roomName, setRoomName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  // removed unused isLoading state
  const {
    board,
    startGame,
    isPlaying,
    createRoom,
    roomsList,
    joinRoom,
    leaveRoom,
    currentRoom,
    socket,
    currentRoomPlayers,
    opponentSpectres,
    nextBlocksPreview,
  penaltyFlash,
    winner,
  } = useTetris();

  // État pour afficher le fallback offline
  const [showOffline, setShowOffline] = useState(false);
  // Détection de la perte de connexion socket
  if (!socket && !showOffline && isPlaying) {
    setShowOffline(true);
  }
  const handleReconnect = () => {
    window.location.reload();
  };

  const handleStartGame = useCallback(async () => {
    await startGame();
  }, [startGame]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
  if (!socket) return;
  createRoom(roomName);
    setRoomName("");
  };

  // Filter rooms based on search query
  const filteredRooms = roomsList.filter((room) =>
    room.roomName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, "gi");
    return text.split(regex).map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="font-SlussenBold text-vampireBlack">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <>
      {showOffline && (
        <div className="fixed inset-0 bg-vampireBlack bg-opacity-80 z-50 flex flex-col items-center justify-center gap-6">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-4">
            <span className="text-lg font-bold text-red-600">Connexion au serveur perdue</span>
            <span className="text-davysGrey">Vous êtes en mode solo local. Certaines fonctionnalités multijoueur sont désactivées.</span>
            <Button onClick={handleReconnect} className="bg-davysGrey text-white">Recharger et tenter de se reconnecter</Button>
          </div>
        </div>
      )}
      {winner && (
        <div className="fixed inset-0 bg-vampireBlack bg-opacity-80 z-50 flex flex-col items-center justify-center gap-6">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-4">
            <span className="text-lg font-bold text-green-700">
              {winner === socket?.id
                ? "Félicitations, vous êtes le vainqueur !"
                : `Partie terminée. Le vainqueur est : ${winner.slice(0, 5)}`}
            </span>
            <Button onClick={() => window.location.reload()} className="bg-davysGrey text-white">Nouvelle partie</Button>
          </div>
        </div>
      )}
      <div className="flex flex-row gap-8 items-start justify-center">
        <Board currentBoard={board} penaltyFlash={penaltyFlash} />
        <NextPieces nextBlocks={nextBlocksPreview} />
      </div>
      {/* Affichage des spectres adverses */}
      <div className="mt-4">
        <OpponentSpectres opponentSpectres={opponentSpectres} />
      </div>
      <div className="controls">
        <Button onClick={handleStartGame} disabled={isPlaying}>
          {currentRoom ? "Start Multiplayer" : "Start Singleplayer"}
        </Button>
      </div>

  {/* Search input for rooms */}
  {!currentRoom && (
        <>
          <div className="mb-4">
            <Input
              label="Search rooms"
              variant="outline"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search rooms..."
            />
          </div>

          <div className="space-y-2">
            <p>Available rooms:</p>
            {filteredRooms.length > 0 ? (
        filteredRooms.map((room) => (
                <Button
                  key={room.id}
                  onClick={() => socket && joinRoom(room)}
                  disabled={!socket}
                  showPing={room.id === socket?.id}
                  className="relative"
                >
                  {highlightMatch(room.roomName, searchQuery)}
                </Button>
              ))
            ) : (
              <p className="text-davysGrey">
                No rooms found matching your search
              </p>
            )}
          </div>

          <form
            onSubmit={handleCreateRoom}
            className="flex w-full justify-between items-end gap-2 mt-4"
          >
            <Input
              label="Create a room"
              variant="primary"
              type="text"
              name="room"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
            />
            <Button type="submit" className="w-1/2">
              Create room
            </Button>
          </form>
        </>
      )}

      {currentRoom && (
        <div className="mt-4 flex flex-col gap-2 items-center">
          <div className="text-davysGrey">Room: {currentRoom}</div>
          <div className="text-davysGrey">
            Players ({currentRoomPlayers?.length || 0}):
            {" "}
            {currentRoomPlayers?.map((id) => id.slice(0, 5)).join(", ")}
          </div>
          <Button
            onClick={leaveRoom}
            variant="outline"
          >
            Leave room
          </Button>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}
