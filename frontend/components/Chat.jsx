import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io.connect("http://localhost:3000");

function Chat({ currentUser, recipient, listing, onClose }) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [conversationId, setConversationId] = useState(null);

  // Create unique room ID and fetch conversation
  useEffect(() => {
    if (currentUser && recipient) {
      // Create unique room ID
      const ids = [currentUser.id, recipient.id].sort();
      const room = `room_${ids.join("_")}`;
      setRoomId(room);
      socket.emit("join_room", room);

      // Find or create conversation
      const fetchConversation = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            `http://localhost:3000/conversations?user1=${currentUser.id}&user2=${recipient.id}&listing=${listing.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = await response.json();
          if (response.ok && data.conversation) {
            setConversationId(data.conversation._id);
            fetchMessages(data.conversation._id);
          }
        } catch (err) {
          console.error("Error fetching conversation:", err);
        }
      };

      fetchConversation();
    }
  }, [currentUser, recipient, listing.id]);

  // Fetch messages for conversation
  const fetchMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/messages?conversation=${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        // Properly handle sender information
        const formattedMessages = data.messages.map((msg) => ({
          _id: msg._id,
          message: msg.content,
          senderId: msg.sender._id,
          senderName: msg.sender.name,
          timestamp: msg.createdAt,
        }));
        setChatHistory(formattedMessages);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      setChatHistory((prev) => [
        ...prev,
        {
          ...data,
          content: data.content || data.message,
          timestamp: data.timestamp || new Date().toISOString(),
        },
      ]);
    };

    socket.on("receive_private_message", handleReceiveMessage);

    return () => {
      socket.off("receive_private_message", handleReceiveMessage);
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() === "") return;

    const messageData = {
      room: roomId,
      message: message.trim(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      recipientId: recipient.id,
      listingId: listing.id,
    };

    console.log("Sending message:", messageData);
    socket.emit("send_private_message", messageData);
    setMessage("");
  };

  return (
    <div
      className="modal"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Chat with {recipient.name} about: {listing.title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div
              style={{
                height: "300px",
                overflowY: "auto",
                marginBottom: "10px",
                padding: "10px",
                border: "1px solid #dee2e6",
                borderRadius: "5px",
              }}
            >
              {chatHistory.length === 0 ? (
                <div className="text-center text-muted py-4">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg._id || msg.timestamp}
                    className={`mb-2 ${
                      msg.senderId === currentUser.id ? "text-end" : ""
                    }`}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="fw-bold">
                        {msg.senderId === currentUser.id
                          ? "You"
                          : msg.senderName}
                      </small>
                      <small className="text-muted">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                    <div
                      className={`rounded p-2 d-inline-block ${
                        msg.senderId === currentUser.id
                          ? "bg-primary text-white"
                          : "bg-light"
                      }`}
                      style={{ maxWidth: "80%" }}
                    >
                      {msg.content}
                    </div>
                    <div
                      className="text-muted mt-1"
                      style={{ fontSize: "0.7rem" }}
                    >
                      {new Date(msg.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                aria-label="Message input"
              />
              <button
                className="btn btn-primary"
                onClick={sendMessage}
                disabled={message.trim() === ""}
                aria-label="Send message"
              >
                <i className="bi bi-send"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
