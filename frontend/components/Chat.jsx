import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io.connect("http://localhost:3000");

function Chat({ currentUser, recipient, listing, onClose }) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [roomId, setRoomId] = useState("");
  
  // Create unique room ID based on user IDs
  useEffect(() => {
    if (currentUser && recipient) {
      const ids = [currentUser.id, recipient.id].sort();
      const room = `room_${ids.join('_')}`;
      setRoomId(room);
      socket.emit("join_room", room);
    }
  }, [currentUser, recipient]);

  useEffect(() => {
    socket.on("receive_private_message", (data) => {
      setChatHistory(prev => [...prev, data]);
    });
    
    return () => {
      socket.off("receive_private_message");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() === "") return;
    
    const messageData = {
      room: roomId,
      message: message,
      senderId: currentUser.id,
      senderName: currentUser.name,
      timestamp: new Date().toISOString(),
      listingId: listing.id,
      listingTitle: listing.title
    };
    
    socket.emit("send_private_message", messageData);
    setMessage("");
  };

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Chat with {recipient.name} about: {listing.title}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div style={{ height: '300px', overflowY: 'auto', marginBottom: '10px' }}>
              {chatHistory.map((msg, index) => (
                <div 
                  key={index} 
                  className={`mb-2 ${msg.senderId === currentUser.id ? 'text-end' : ''}`}
                >
                  <div className="d-flex justify-content-between">
                    <small className="fw-bold">
                      {msg.senderId === currentUser.id ? "You" : msg.senderName}
                    </small>
                    <small className="text-muted">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </small>
                  </div>
                  <div 
                    className={`rounded p-2 ${msg.senderId === currentUser.id ? 
                      'bg-primary text-white' : 'bg-light'}`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button 
                className="btn btn-primary" 
                onClick={sendMessage}
                disabled={message.trim() === ""}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;