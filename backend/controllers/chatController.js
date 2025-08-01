const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const sendMessageEmailNotification = require("../utils/sendMessageEmailNotification");

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

    // Handle joining user-specific room for notifications
    socket.on("join_user_room", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User joined notification room: user_${userId}`);
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

        // Emit message to both participants
        const room = `room_${[senderId, recipientId].sort().join("_")}`;
        io.to(room).emit("receive_private_message", {
          _id: newMessage._id,
          conversationId: conversation._id.toString(),
          senderId,
          senderName: data.senderName,
          content: message,
          timestamp: new Date().toISOString(),
        });

        // Notify recipient of new message
        io.to(`user_${recipientId}`).emit("new_message", {
          conversationId: conversation._id,
          senderId,
          senderName: data.senderName,
          message: message,
        });

        await sendMessageEmailNotification({
          recipientId,
          senderName: data.senderName,
          message,
        });
      } catch (err) {
        console.error("Error saving message:", err);
      }
    });

    socket.on("fetch_conversations", async (userId) => {
      try {
        const conversations = await Conversation.find({
          participants: userId,
        })
          .populate("participants", "name email")
          .populate("listing", "title")
          .populate("lastMessage")
          .sort({ "lastMessage.createdAt": -1 });

        socket.emit("conversations_list", conversations);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    });

    socket.on("send_file_message", async (data) => {
      try {
        const {
          senderId,
          recipientId,
          listingId,
          fileName,
          fileData,
          fileType,
          senderName,
        } = data;

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

        const buffer = Buffer.from(fileData, "base64");
        const uploadDir = path.join(__dirname, "..", "uploads");
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);

        const newMessage = new Message({
          conversation: conversation._id,
          sender: senderId,
          content: `file://${fileName}`,
          listing: listingId,
        });

        await newMessage.save();
        conversation.lastMessage = newMessage._id;
        await conversation.save();

        const room = `room_${[senderId, recipientId].sort().join("_")}`;
        io.to(room).emit("receive_private_message", {
          _id: newMessage._id,
          conversationId: conversation._id.toString(),
          senderId,
          senderName,
          content: `file://${fileName}`,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error handling file message:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
