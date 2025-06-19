// Chat.jsx — Enhanced Chat UI Design
import React, { useState, useEffect } from "react";
import socket from "../src/socket";

const Chat = ({ currentUser, recipient, listing, isModal = true, initialMessages = [], conversationId }) => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState(initialMessages);
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    if (!currentUser?.id || !recipient?.id || !listing?.id) return;
    const ids = [currentUser.id, recipient.id].sort();
    const room = `room_${ids.join("_")}`;
    setRoomId(room);
    socket.emit("join_room", room);
  }, [currentUser, recipient, listing]);

  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/messages?conversationId=${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      const msgs = data.messages.map((msg) => ({
        _id: msg._id,
        content: msg.content,
        senderId: msg.sender._id,
        senderName: msg.sender.name,
        timestamp: msg.createdAt,
      }));
      setChatHistory(msgs);
    };

    if (conversationId) fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    const handleReceive = (data) => {
      if (data.conversationId === conversationId && data.senderId !== currentUser.id) {
        setChatHistory((prev) => [
          ...prev,
          {
            _id: data._id || Date.now().toString(),
            content: data.content,
            senderId: data.senderId,
            senderName: data.senderName,
            timestamp: data.timestamp || new Date().toISOString(),
          },
        ]);
      }
    };

    socket.on("receive_private_message", handleReceive);
    return () => socket.off("receive_private_message", handleReceive);
  }, [conversationId, currentUser.id]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const msgData = {
      room: roomId,
      senderId: currentUser.id,
      recipientId: recipient.id,
      listingId: listing.id,
      message: message.trim(),
      senderName: currentUser.name,
      conversationId: conversationId,
    };

    socket.emit("send_private_message", msgData);

    setChatHistory((prev) => [
      ...prev,
      {
        _id: Date.now().toString(),
        content: message.trim(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        timestamp: new Date().toISOString(),
        isLocal: true,
      },
    ]);

    setMessage("");
  };

  return (
    <div className="d-flex flex-column h-100 border rounded shadow-sm">
      <div className="flex-grow-1 overflow-auto p-4 bg-white" style={{ maxHeight: "500px" }}>
        {chatHistory.map((msg) => (
          <div
            key={msg._id}
            className={`mb-4 d-flex ${msg.senderId === currentUser.id ? "justify-content-end" : "justify-content-start"}`}
          >
            <div
              className={`p-3 rounded-3 shadow-sm text-break ${
                msg.senderId === currentUser.id ? "bg-primary text-white" : "bg-light text-dark"
              }`}
              style={{ maxWidth: "70%" }}
            >
              <div className="small fw-semibold mb-1">
                {msg.senderId === currentUser.id ? "You" : msg.senderName}
              </div>
              <div>{msg.content}</div>
              <div className="text-end text-muted mt-2" style={{ fontSize: "0.75rem" }}>
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-top p-3 bg-light">
        <div className="input-group">
          <input
            className="form-control rounded-start-pill px-4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
          />
          <button
            className="btn btn-primary rounded-end-pill px-4"
            onClick={sendMessage}
            disabled={!message.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
