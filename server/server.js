const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const TetrisGame = require("./tetris");
const Player = require("./player");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // allow all origins in dev
        methods: ["GET", "POST"],
    },
});

const rooms = {};
const game = new TetrisGame();

const ALL_BLOCKS = Object.values(require("./types").Block);

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function ensureSequence(room, n) {
    if (!room.sequence) room.sequence = [];
    if (!room.bag) room.bag = [];
    while (room.sequence.length - (room.cursor || 0) < n) {
        if (room.bag.length === 0) room.bag = shuffle([...ALL_BLOCKS]);
        room.sequence.push(room.bag.pop());
    }
}

function getRoomIdByPlayer(playerId) {
    for (const [id, room] of Object.entries(rooms)) {
        if (room.players.includes(playerId)) return id;
    }
    return null;
}

function emitRoomsList() {
    io.emit("roomsList", JSON.stringify(Object.values(rooms)));
    console.log("Sending rooms list", Object.values(rooms));
}

io.on("connection", (socket) => {
    // Gestion des spectres adverses
    socket.on("updateSpectre", (heights) => {
        const roomId = getRoomIdByPlayer(socket.id);
        if (!roomId || !rooms[roomId]) return;
        const room = rooms[roomId];
        if (!room.spectres) room.spectres = {};
        room.spectres[socket.id] = heights;
        // Broadcast à tous les joueurs de la room
        io.to(roomId).emit("spectresUpdate", { ...room.spectres });
    });
    console.log("a user connected");
    console.log("Rooms: ", rooms);

    game.addPlayer(socket.id);

    // (duplicate disconnect handler removed; see unified handler below)

    // Handle game events here
    socket.on("startGame", () => {
        const roomId = getRoomIdByPlayer(socket.id);
        if (!roomId || !rooms[roomId]) return;

        const room = rooms[roomId];
        if (room.host !== socket.id) {
            socket.emit("notHost");
            return;
        }

        room.started = true;
        // Initialize per-player cursors
        if (!room.playerCursors) room.playerCursors = {};
        // Ensure at least 3 upcoming pieces
        if (room.cursor == null) room.cursor = 0; // legacy; not used further
        ensureSequence(room, 3);
        const initialBlocks = [
            room.sequence[0],
            room.sequence[1],
            room.sequence[2],
        ];
        room.players.forEach((playerId) => {
            room.playerCursors[playerId] = 3;
            io.to(playerId).emit("gameStarted", initialBlocks);
        });
    });

    // Permet de demander plusieurs blocks d’avance : socket.emit('requestNewBlock', count)
    socket.on("requestNewBlock", (count = 1) => {
        const roomId = getRoomIdByPlayer(socket.id);
        if (!roomId || !rooms[roomId]) return;
        const room = rooms[roomId];
        if (!room.started) return;
        if (!room.playerCursors) room.playerCursors = {};
        const cursor = room.playerCursors[socket.id] ?? 0;
        const n = Math.max(1, Number(count) || 1);
        // S’assurer qu’il y a assez de blocks dans la séquence
        ensureSequence(room, cursor + n);
        const newBlocks = room.sequence.slice(cursor, cursor + n);
        room.playerCursors[socket.id] = cursor + n;
        // Si un seul block, compatibilité : on envoie le block seul, sinon un tableau
        if (newBlocks.length === 1) {
            socket.emit("newBlock", newBlocks[0]);
        } else {
            socket.emit("newBlock", newBlocks);
        }
    });

    socket.on("linesCleared", (n) => {
        const roomId = getRoomIdByPlayer(socket.id);
        if (!roomId || !rooms[roomId]) return;
        const garbage = Math.max(0, (Number(n) || 0) - 1);
        if (garbage > 0) {
            socket.to(roomId).emit("addGarbage", garbage);
        }
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
        const id = socket.id; // keep current design: room id == creator id
        const newRoom = {
            roomName,
            players: [id],
            id,
            host: socket.id,
            started: false,
            sequence: [],
            bag: [],
            cursor: 0,
            playerCursors: { [id]: 0 },
        };
        rooms[id] = newRoom;
        socket.join(id);
        emitRoomsList();
        console.log("Created room", roomName, "with id", id);
        socket.emit("roomCreated", newRoom);
    });

    socket.on("joinRoom", (id) => {
        if (!rooms[id]) {
            console.log("Room does not exist:", id);
            return;
        }
        if (rooms[id].started) {
            socket.emit("roomLocked");
            return;
        }
        if (!rooms[id].players.includes(socket.id)) {
            rooms[id].players.push(socket.id);
        }
        if (!rooms[id].playerCursors) rooms[id].playerCursors = {};
        rooms[id].playerCursors[socket.id] = 0;
        socket.join(id);
        emitRoomsList();
        console.log("Joined room", id, "players:", rooms[id].players);
        socket.emit("joinedRoom", rooms[id]);
        socket.to(id).emit("playerJoined", socket.id);
    });

    socket.on("leaveRoom", (roomId) => {
        const room = rooms[roomId];
        if (room) {
            room.players = room.players.filter((p) => p !== socket.id);
            if (room.playerCursors) {
                delete room.playerCursors[socket.id];
            }
            socket.leave(roomId);
            socket.to(roomId).emit("playerLeft", socket.id);

            if (room.players.length === 0) {
                delete rooms[roomId];
            } else if (room.host === socket.id) {
                // host transfer
                room.host = room.players[0];
                io.to(roomId).emit("hostChanged", room.host, roomId);
            }
            emitRoomsList();
            console.log("Left room", roomId);
        }
    });

    socket.on("getRooms", () => {
        emitRoomsList();
    });

    // Host transfer/disconnect handling
    socket.on("disconnect", () => {
        console.log("user disconnected");
        game.removePlayer(socket.id);

        for (const roomId in rooms) {
            const room = rooms[roomId];
            const before = room.players.length;
            room.players = room.players.filter((p) => p !== socket.id);
            if (room.playerCursors) {
                delete room.playerCursors[socket.id];
            }
            if (room.players.length === 0) {
                delete rooms[roomId];
            } else if (room.host === socket.id) {
                room.host = room.players[0];
                io.to(roomId).emit("hostChanged", room.host, roomId);
            }
            if (before !== room.players.length) {
                emitRoomsList();
            }
        }

        console.log("Rooms after cleanup:", rooms);
    });

    // Gestion de la reconnexion d'un joueur déjà dans la room
    socket.on("reconnectToRoom", () => {
        const roomId = getRoomIdByPlayer(socket.id);
        if (!roomId || !rooms[roomId]) {
            socket.emit(
                "reconnectFailed",
                "Room introuvable ou joueur non inscrit"
            );
            return;
        }
        const room = rooms[roomId];
        if (!room.started) {
            socket.emit("reconnectFailed", "La partie n'a pas commencé");
            return;
        }
        if (!room.playerCursors) room.playerCursors = {};
        const cursor = room.playerCursors[socket.id] ?? 0;
        // On envoie les 3 prochains blocks à partir du curseur
        ensureSequence(room, cursor + 3);
        const nextBlocks = [
            room.sequence[cursor],
            room.sequence[cursor + 1],
            room.sequence[cursor + 2],
        ];
        room.playerCursors[socket.id] = cursor + 3;

        // Récupérer l'état du joueur (score, plateau, spectre)
        const playerState = (game.players && game.players.get(socket.id)) || {};
        const board = playerState.board || null;
        const score = playerState.score || 0;
        const spectre = (room.spectres && room.spectres[socket.id]) || null;

        socket.emit("reconnected", {
            nextBlocks,
            board,
            score,
            spectre,
        });
    });

    // Gestion de la fin de partie : un joueur signale sa défaite
    socket.on("playerLost", () => {
        const roomId = getRoomIdByPlayer(socket.id);
        if (!roomId || !rooms[roomId]) return;
        const room = rooms[roomId];
        // Marquer le joueur comme éliminé
        if (!room.losers) room.losers = [];
        if (!room.losers.includes(socket.id)) room.losers.push(socket.id);

        // Vérifier s'il ne reste qu'un survivant
        const alive = room.players.filter((p) => !room.losers.includes(p));
        if (alive.length === 1) {
            // Envoyer l'événement gameOver à tous les joueurs de la room
            io.to(roomId).emit("gameOver", { winner: alive[0] });
            room.started = false;
            // Optionnel : reset la room ou la séquence ici
        } else if (alive.length === 0) {
            // Cas extrême : tout le monde perd en même temps
            io.to(roomId).emit("gameOver", { winner: null });
            room.started = false;
        }
    });
});

server.listen(3001, () => {
    console.log("listening on *:3001");
});
