const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
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
    socket.on("send_private_message", async (data) => {
      try {
        const { senderId, recipientId, listingId, message } = data;

        // Find or create conversation
        let conversation = await Conversation.findOne({
          participants: { $all: [senderId, recipientId], $size: 2 },
          listing: listingId,
        });

        if (!conversation) {
          conversation = new Conversation({
            participants: [senderId, recipientId],
            listing: listingId,
          });
          await conversation.save();
        }

        // Save message
        const newMessage = new Message({
          conversation: conversation._id,
          sender: senderId,
          content: message,
          listing: listingId,
        });
        await newMessage.save();

        // Update conversation last message
        conversation.lastMessage = newMessage._id;
        await conversation.save();

        // Emit message with database ID
        io.to(data.room).emit("receive_private_message", {
          ...data,
          _id: newMessage._id,
          content: message, 
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error saving message:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
