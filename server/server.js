const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const TetrisGame = require("./tetris");
const Player = require("./player");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Adjust this to match your client's origin
    methods: ["GET", "POST"],
  },
});

const rooms = {};
const game = new TetrisGame();

function emitRoomsList() {
  io.emit("roomsList", JSON.stringify(Object.values(rooms)));
  console.log("Sending rooms list", Object.values(rooms));
}

io.on("connection", (socket) => {
  console.log("a user connected");
  console.log("Rooms: ", rooms);

  game.addPlayer(socket.id);

  socket.on("disconnect", () => {
    console.log("user disconnected");
    game.removePlayer(socket.id);

    // Vérifier dans quelle salle il était et le retirer
    for (const roomId in rooms) {
      rooms[roomId].players = rooms[roomId].players.filter(
        (p) => p !== socket.id
      );
      if (rooms[roomId].players.length === 0) {
        delete rooms[roomId]; // Supprimer la salle si elle est vide
      }
    }

    emitRoomsList();
    console.log("Rooms after cleanup:", rooms);
  });

  // Handle game events here
  socket.on("startGame", () => {
    console.log("Game started");
    const initialBlocks = game.startGameForPlayer(socket.id);

    if (rooms[socket.id]) {
      rooms[socket.id].players.forEach((playerId) => {
        io.to(playerId).emit("gameStarted", initialBlocks);
      });
    } else {
      socket.emit("gameStarted", initialBlocks);
    }
  });

  socket.on("requestNewBlock", () => {
    const newBlock = game.getRandomBlock();
    socket.emit("newBlock", newBlock);
  });

  socket.on("movePiece", (direction) => {
    console.log("Piece moved", direction);
  });

  socket.on("rotatePiece", () => {
    console.log("Piece rotated");
  });

  socket.on("dropPiece", () => {
    console.log("Piece dropped");
  });

  socket.on("createRoom", (roomName) => {
    const id = socket.id;
    const newRoom = { roomName, players: [id], id };
    rooms[id] = newRoom;
    socket.join(id);
    emitRoomsList();
    console.log("Created room", roomName);
  });

  socket.on("joinRoom", (id) => {
    if (!rooms[id]) {
      console.log("Room does not exist:", id);
      return;
    }
    rooms[id].players.push(socket.id);
    socket.join(id);
    emitRoomsList();
    console.log("Joined room", id);
  });

  socket.on("leaveRoom", (room) => {
    if (rooms[room]) {
      rooms[room].players = rooms[room].players.filter((p) => p !== socket.id);
      if (rooms[room].players.length === 0) {
        delete rooms[room]; // Supprimer la salle si elle est vide
      }
      socket.leave(room);
      emitRoomsList();
      console.log("Left room", room);
    }
  });

  socket.on("getRooms", () => {
    emitRoomsList();
  });
});

server.listen(3001, () => {
  console.log("listening on *:3001");
});
