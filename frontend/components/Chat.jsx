import React, { useState, useEffect } from "react";
import socket from "../src/socket";
import ReviewModal from './ReviewModal';
import { MdReport } from "react-icons/md";

const Chat = ({
  currentUser,
  recipient,
  listing,
  isModal = true,
  initialMessages = [],
  conversationId,
}) => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState(initialMessages);
  const [roomId, setRoomId] = useState("");
  const [file, setFile] = useState(null);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    if (!currentUser?.id || !recipient?.id || !listing?.id) return;
    if (chatHistory.length >= 3) {
      checkReviewEligibility();
    }
    const ids = [currentUser.id, recipient.id].sort();
    const room = `room_${ids.join("_")}`;
    setRoomId(room);
    socket.emit("join_room", room);
  }, [chatHistory.length, currentUser, recipient, listing]);

  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/messages?conversationId=${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

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
      if (
        data.conversationId === conversationId &&
        data.senderId !== currentUser.id
      ) {
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

  const handleSend = () => {
    if (!roomId || !currentUser?.id || !recipient?.id || !listing?.id) return;

    const timestamp = new Date().toISOString();

    if (message.trim()) {
      const msgData = {
        room: roomId,
        senderId: currentUser.id,
        recipientId: recipient.id,
        listingId: listing.id,
        message: message.trim(),
        senderName: currentUser.name,
        conversationId,
      };

      socket.emit("send_private_message", msgData);

      setChatHistory((prev) => [
        ...prev,
        {
          _id: Date.now().toString(),
          content: message.trim(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          timestamp,
        },
      ]);
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = reader.result.split(",")[1];

        socket.emit("send_file_message", {
          senderId: currentUser.id,
          recipientId: recipient.id,
          listingId: listing.id,
          fileName: file.name,
          fileData,
          fileType: file.type,
          senderName: currentUser.name,
          conversationId,
        });

        setChatHistory((prev) => [
          ...prev,
          {
            _id: Date.now().toString(),
            content: `file://${file.name}`,
            senderId: currentUser.id,
            senderName: currentUser.name,
            timestamp,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }

    setMessage("");
    setFile(null);
  };

  const handleReport = (msg) => {
  setSelectedMessage(msg);
  setShowReportModal(true);
};

  const handleReviewSubmitted = (review) => {
    setShowReviewModal(false);
    setShowReviewPrompt(false);
    setCanReview(false);
  };

  const checkReviewEligibility = async () => {
    if (!currentUser?.id || !recipient?.id || !listing?.id) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/reviews/can-review/${recipient.id}/${listing.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCanReview(data.canReview);

        if (data.canReview && chatHistory.length >= 3) {
          setShowReviewPrompt(true);
        }
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  return (
    <div className="d-flex flex-column h-100 border rounded shadow-sm">
      <div className="flex-grow-1 overflow-auto p-4 bg-white" style={{ maxHeight: "500px" }}>
        {chatHistory.length === 0 ? (
          <div className="text-center text-muted mt-5">
            Type a message below to start the conversation.
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div key={msg._id} className={`mb-4 d-flex align-items-start position-relative ${msg.senderId === currentUser.id ? "justify-content-end" : "justify-content-start"}`}>
              {msg.senderId !== currentUser.id && (
                <div className="position-absolute top-0 start-100 translate-middle-x mt-1">
                  <button
                    className="btn btn-light btn-sm border-0" title="Report this message" style={{ transition: 'transform 0.2s ease', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.15)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)' }
                    onClick={() => handleReport(msg)}
                  >
                    <MdReport size={18} color="red" />
                  </button>
                </div>
              )}
              <div className={`p-3 rounded-3 shadow-sm text-break ${msg.senderId === currentUser.id ? "bg-primary text-white" : "bg-light text-dark"}`} style={{ maxWidth: "70%" }}>
                <div className="small fw-semibold mb-1">
                  {msg.senderId === currentUser.id ? "You" : msg.senderName}
                </div>
                <div>
                  {msg.content.startsWith("file://") ? (
                    <a
                      href={`http://localhost:3000/uploads/${msg.content.replace("file://", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      📎 {msg.content.replace("file://", "")}
                    </a>
                  ) : (
                    msg.content
                  )}
                </div>
                <div className="text-end text-muted mt-2" style={{ fontSize: "0.75rem" }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && selectedMessage && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Report Message</h5>
                <button type="button" className="btn-close" onClick={() => setShowReportModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Why are you reporting this message?</p>
                <textarea className="form-control" rows="3" id="reportReason"></textarea>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowReportModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={async () => {
                  const reason = document.getElementById("reportReason").value;
                  if (!reason) return alert("Please enter a reason.");
                  try {
                    const token = localStorage.getItem("token");
                    const res = await fetch(`http://localhost:3000/messages/${selectedMessage._id}/report`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ reason }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert("Message reported successfully.");
                      setShowReportModal(false);
                    } else {
                      alert(data.error || "Failed to report.");
                    }
                  } catch (error) {
                    console.error("Report failed:", error);
                  }
                }}>Submit Report</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-top p-3 bg-light">
        <div className="input-group mb-2">
          <input
            type="file"
            className="form-control"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>
        <div className="input-group">
          <input
            className="form-control rounded-start-pill px-4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
          />
          <button
            className="btn btn-primary rounded-end-pill px-4"
            onClick={handleSend}
            disabled={!message.trim() && !file}
          >
            Send
          </button>
        </div>

        {showReviewPrompt && canReview && (
          <div className="border-top p-3 bg-info bg-opacity-10">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="mb-1">
                  <i className="bi bi-star me-2"></i>
                  How was your experience?
                </h6>
                <small className="text-muted">
                  Help others by sharing your experience with {recipient?.name}
                </small>
              </div>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowReviewPrompt(false)}
                >
                  Later
                </button>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => setShowReviewModal(true)}
                >
                  <i className="bi bi-star me-1"></i>
                  Write Review
                </button>
              </div>
            </div>
          </div>
        )}

        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          reviewee={recipient}
          listing={listing}
          onReviewSubmitted={handleReviewSubmitted}
        />
      </div>
    </div>
  );
};

export default Chat;
