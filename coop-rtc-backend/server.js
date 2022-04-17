const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const port = process.env.PORT || 4000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Server running");
});

const rooms = {};

io.on("connection", (socket) => {
  socket.on("join room", (roomID) => {
    //If room already exists push the new users socket ID into the array inside 'rooms' with that roomID
    if (rooms[roomID] && rooms[roomID].length < 2) {
      rooms[roomID].push(socket.id);
    } else {
      rooms[roomID] = [socket.id]; //If room doesn't exist, add single person socket ID into the new array, at this roomID inside the rooms object
    }

    //Try to find other users in the room
    const otherUser = rooms[roomID].find((id) => id != socket.id);

    if (otherUser) {
      socket.emit("other user", otherUser); //Tell new user that other users exist
      socket.to(otherUser).emit("user joined", socket.id); //Tell other users that new user exists
    }
  });

  socket.on("offer", (payload) => {
    io.to(payload.target).emit("offer", payload); //Send an event to payload.target (target is socketID of user we want to send an event to). Payload contains information about the sender (me) and the actual offer too.
  });

  socket.on("answer", (payload) => {
    io.to(payload.target).emit("answer", payload); //When the user whom the offer was sent reply back. Here the target is the original sender/user.
  });

  socket.on("ice-candidate", (incoming) => {
    /*
     * ICE, Interactive Connectivity Establishment, to traverse NAT's and firewalls.
     * As part of the ICE process, the browser may utilize STUN (Session Traversal Utilities for NAT) and TURN (Traversal Using Relays around NAT, these are costlier to operate than STUN) servers.
     * The addresses to STUN and TURN servers are sent to the browser via an ICE configuration.
     */
    io.to(incoming.target).emit("ice-candidate", incoming.candidate); //Both peers send their candidates to eachother and overtime come to a conclusion over which candidate to use and then they finish the handshake.
  });
});

server.listen(port, () => console.log(`Server is listening at port ${port}`));
