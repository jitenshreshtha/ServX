// controllers/chatController.js
const { Server } = require("socket.io");

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Handle joining private rooms
    socket.on("join_room", (room) => {
      socket.join(room);
      console.log(`User joined room: ${room}`);
    });

    // Handle private messages
    socket.on("send_private_message", (data) => {
      io.to(data.room).emit("receive_private_message", {
        ...data,
        timestamp: new Date().toISOString()
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};