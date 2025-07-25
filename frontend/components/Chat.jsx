import React, { useState, useEffect } from "react";
import socket from "../src/socket";
import ReviewModal from './ReviewModal';
import RequestModal from './RequestModal';
import { MdReport } from "react-icons/md";

const getId = (obj) => obj?.id || obj?._id || "";

const Chat = ({
  currentUser,
  recipient,
  listing,
  isModal = true,
  initialMessages = [],
  conversationId,
}) => {
  const senderId = getId(currentUser);
  const recipientId = getId(recipient);
  const listingId = getId(listing);

  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState(initialMessages);
  const [roomId, setRoomId] = useState("");
  const [file, setFile] = useState(null);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // New request-related state
  const [hasPermissionToChat, setHasPermissionToChat] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState("");

  // Prevent render if required IDs are missing
  if (!senderId || !recipientId || !listingId) {
    return <div>Loading chat...</div>;
  }

  // Check if user has permission to chat (conversation exists or request is accepted)
  useEffect(() => {
    const checkChatPermission = async () => {
      if (!senderId || !recipientId || !listingId) return;
      
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        // First check if conversation already exists
        if (conversationId) {
          setHasPermissionToChat(true);
          setLoading(false);
          return;
        }

        // Check if there's an accepted request or existing conversation
        const response = await fetch(
          `http://localhost:3000/requests/can-send/${recipientId}/${listingId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to check chat permission');
        }

        const data = await response.json();
        
        if (data.existingRequest && data.existingRequest.status === 'accepted') {
          setHasPermissionToChat(true);
          setRequestStatus('accepted');
        } else if (data.existingRequest && data.existingRequest.status === 'pending') {
          setHasPermissionToChat(false);
          setRequestStatus('pending');
          setPermissionError(`You have a pending request. Please wait for ${recipient?.name} to respond.`);
        } else if (data.canSend) {
          setHasPermissionToChat(false);
          setRequestStatus('none');
          setPermissionError(`You need to send a connection request to ${recipient?.name} before you can chat.`);
        } else {
          setHasPermissionToChat(false);
          setPermissionError(data.reason || 'Cannot start conversation');
        }

      } catch (error) {
        console.error('Error checking chat permission:', error);
        setPermissionError('Unable to verify chat permissions');
      } finally {
        setLoading(false);
      }
    };

    checkChatPermission();
  }, [senderId, recipientId, listingId, conversationId, recipient?.name]);

  // Debug: socket connection status
  useEffect(() => {
    if (!hasPermissionToChat) return;

    socket.on("connect", () => {
      console.log("Socket connected with id:", socket.id);
    });
    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, [hasPermissionToChat]);

  // Join room on mount or when participants/listing changes
  useEffect(() => {
    if (!hasPermissionToChat || !senderId || !recipientId || !listingId) return;
    
    if (chatHistory.length >= 3) {
      checkReviewEligibility();
    }
    const ids = [senderId, recipientId].sort();
    const room = `room_${ids.join("_")}`;
    setRoomId(room);
    socket.emit("join_room", room);
    console.log("Joined room", room);
  }, [hasPermissionToChat, chatHistory.length, senderId, recipientId, listingId]);

  // Load message history on conversation change
  useEffect(() => {
    if (!hasPermissionToChat) return;

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
        senderId: getId(msg.sender),
        senderName: msg.sender.name,
        timestamp: msg.createdAt,
      }));
      setChatHistory(msgs);
    };

    if (conversationId) fetchMessages();
  }, [conversationId, hasPermissionToChat]);

  // Socket: Receive new message from backend
  useEffect(() => {
    if (!hasPermissionToChat) return;

    const handleReceive = (data) => {
      console.log("Socket receive_private_message:", data);
      if (
        data.conversationId === conversationId &&
        data.senderId !== senderId
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
  }, [conversationId, senderId, hasPermissionToChat]);

  // Send message or file
  const handleSend = () => {
    if (!hasPermissionToChat || !roomId || !senderId || !recipientId || !listingId) {
      console.warn("Missing permission or data, cannot send message");
      return;
    }

    const timestamp = new Date().toISOString();

    if (message.trim()) {
      const msgData = {
        room: roomId,
        senderId,
        recipientId,
        listingId,
        message: message.trim(),
        senderName: currentUser.name,
        conversationId,
      };

      console.log("Emitting send_private_message with data:", msgData);
      socket.emit("send_private_message", msgData);

      setChatHistory((prev) => [
        ...prev,
        {
          _id: Date.now().toString(),
          content: message.trim(),
          senderId,
          senderName: currentUser.name,
          timestamp,
        },
      ]);
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = reader.result.split(",")[1];

        const fileMsg = {
          senderId,
          recipientId,
          listingId,
          fileName: file.name,
          fileData,
          fileType: file.type,
          senderName: currentUser.name,
          conversationId,
        };

        console.log("Emitting send_file_message with data:", fileMsg);
        socket.emit("send_file_message", fileMsg);

        setChatHistory((prev) => [
          ...prev,
          {
            _id: Date.now().toString(),
            content: `file://${file.name}`,
            senderId,
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

  // Handle request sent successfully
  const handleRequestSent = () => {
    setShowRequestModal(false);
    setRequestStatus('pending');
    setPermissionError(`Request sent to ${recipient?.name}. Please wait for them to respond.`);
  };

  // Report a message
  const handleReport = (msg) => {
    setSelectedMessage(msg);
    setShowReportModal(true);
  };

  // Review logic
  const handleReviewSubmitted = (review) => {
    setShowReviewModal(false);
    setShowReviewPrompt(false);
    setCanReview(false);
  };

  const checkReviewEligibility = async () => {
    if (!senderId || !recipientId || !listingId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/reviews/can-review/${recipientId}/${listingId}`,
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

  // Loading state
  if (loading) {
    return (
      <div className="d-flex flex-column h-100 border rounded shadow-sm">
        <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4">
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Checking chat permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  // No permission to chat - show request interface
  if (!hasPermissionToChat) {
    return (
      <div className="d-flex flex-column h-100 border rounded shadow-sm">
        <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4">
          <div className="text-center">
            <div className="mb-4">
              <i className="bi bi-chat-x display-1 text-muted"></i>
            </div>
            
            <h5 className="mb-3">Connection Required</h5>
            <p className="text-muted mb-4">{permissionError}</p>

            {requestStatus === 'none' && (
              <button
                className="btn btn-primary"
                onClick={() => setShowRequestModal(true)}
              >
                <i className="bi bi-person-plus me-2"></i>
                Send Connection Request
              </button>
            )}

            {requestStatus === 'pending' && (
              <div className="alert alert-warning">
                <i className="bi bi-clock me-2"></i>
                <strong>Request Pending</strong>
                <br />
                <small>Waiting for {recipient?.name} to respond to your connection request.</small>
              </div>
            )}

            <div className="mt-4">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => window.history.back()}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Go Back
              </button>
            </div>
          </div>
        </div>

        {/* Request Modal */}
        {showRequestModal && (
          <RequestModal
            isOpen={showRequestModal}
            onClose={() => setShowRequestModal(false)}
            recipient={{
              id: recipientId,
              name: recipient?.name
            }}
            listing={{
              id: listingId,
              title: listing?.title
            }}
            onRequestSent={handleRequestSent}
          />
        )}
      </div>
    );
  }

  // Normal chat interface (when user has permission)
  return (
    <div className="d-flex flex-column h-100 border rounded shadow-sm">
      <div className="flex-grow-1 overflow-auto p-4 bg-white" style={{ maxHeight: "500px" }}>
        {chatHistory.length === 0 ? (
          <div className="text-center text-muted mt-5">
            <div className="mb-3">
              <i className="bi bi-chat-dots display-4 text-muted"></i>
            </div>
            <h6>Start your conversation with {recipient?.name}</h6>
            <p>Type a message below to begin chatting.</p>
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div key={msg._id} className={`mb-4 d-flex align-items-start position-relative ${msg.senderId === senderId ? "justify-content-end" : "justify-content-start"}`}>
              {msg.senderId !== senderId && (
                <div className="position-absolute top-0 start-100 translate-middle-x mt-1">
                  <button
                    className="btn btn-light btn-sm border-0" title="Report this message"
                    style={{ transition: 'transform 0.2s ease', cursor: 'pointer' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    onClick={() => handleReport(msg)}
                  >
                    <MdReport size={18} color="red" />
                  </button>
                </div>
              )}
              <div className={`p-3 rounded-3 shadow-sm text-break ${msg.senderId === senderId ? "bg-primary text-white" : "bg-light text-dark"}`} style={{ maxWidth: "70%" }}>
                <div className="small fw-semibold mb-1">
                  {msg.senderId === senderId ? "You" : msg.senderName}
                </div>
                <div>
                  {msg.isDeleted
                    ? <i className="text-danger">[This message was deleted by admin]</i>
                    : (
                        msg.content.startsWith("file://")
                          ? (
                              <a
                                href={`http://localhost:3000/uploads/${msg.content.replace("file://", "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                              >
                                📎 {msg.content.replace("file://", "")}
                              </a>
                            )
                          : msg.content
                      )
                  }
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

      {/* Chat Input Area */}
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
            onKeyDown={(e) => (e.key === "Enter" && roomId ? handleSend() : null)}
            placeholder="Type your message..."
          />
          <button
            className="btn btn-primary rounded-end-pill px-4"
            onClick={handleSend}
            disabled={!message.trim() && !file || !roomId}
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