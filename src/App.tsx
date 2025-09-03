import { useCallback, useState } from "react";
import "./App.css";
import { Board } from "./components/Board";
import { useTetris } from "./hooks/useTetris";
import Button from "./components/Button";
import Input from "./components/Input";

function App() {
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
  } = useTetris();

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
      <Board currentBoard={board} />
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

export default App;
