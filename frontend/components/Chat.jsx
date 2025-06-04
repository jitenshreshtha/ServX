import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io.connect("http://localhost:3000");

function Chat({
  currentUser,
  recipient,
  listing,
  onClose,
  conversationId,
  isModal = true,
  initialMessages = [], // Add this prop to receive pre-fetched messages
}) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState(initialMessages); // Initialize with pre-fetched messages
  const [roomId, setRoomId] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (currentUser && recipient) {
      // Create unique room ID
      const ids = [currentUser.id, recipient._id].sort();
      const room = `room_${ids.join("_")}`;
      setRoomId(room);
      socket.emit("join_room", room);
    }
  }, [currentUser, recipient]);

  // Fetch messages when conversationId changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) return;

      setLoadingMessages(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:3000/messages?conversationId=${conversationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }

        const data = await response.json();
        const formattedMessages = data.messages.map((msg) => ({
          _id: msg._id,
          content: msg.content,
          senderId: msg.sender?._id,
          senderName: msg.sender?.name,
          timestamp: msg.createdAt,
        }));

        setChatHistory(formattedMessages);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    // Only fetch if we don't have initial messages
    if (initialMessages.length === 0) {
      fetchMessages();
    }
  }, [conversationId]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (data) => {
      if (data.conversationId === conversationId) {
        setChatHistory((prev) => [
          ...prev,
          {
            _id: data._id || Date.now().toString(), // Temporary ID if not provided
            content: data.content || data.message,
            senderId: data.senderId,
            senderName: data.senderName,
            timestamp: data.timestamp || new Date().toISOString(),
          },
        ]);
      }
    };

    socket.on("receive_private_message", handleNewMessage);

    return () => {
      socket.off("receive_private_message", handleNewMessage);
    };
  }, [conversationId]);

  const sendMessage = () => {
    if (message.trim() === "") return;

    const messageData = {
      room: roomId,
      message: message.trim(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      recipientId: recipient._id,
      listingId: listing._id,
    };

    socket.emit("send_private_message", messageData);

    // Add message to local history immediately
    setChatHistory((prev) => [
      ...prev,
      {
        _id: Date.now().toString(), // Temporary ID
        content: message.trim(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        timestamp: new Date().toISOString(),
      },
    ]);

    setMessage("");
  };

  if (!isModal) {
    return (
      <div className="h-100 d-flex flex-column">
        <div
          className="flex-grow-1 overflow-auto p-3"
          style={{ height: "400px" }}
        >
          {loadingMessages ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : chatHistory.length === 0 ? (
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
                    {msg.senderId === currentUser.id ? "You" : msg.senderName}
                  </small>
                  <small className="text-muted">
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Just now"}
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
                <div className="text-muted mt-1" style={{ fontSize: "0.7rem" }}>
                  {new Date(msg.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="input-group p-3 border-top">
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
    );
  }

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
