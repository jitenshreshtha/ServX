// src/components/Chat.jsx
import React, { useState, useEffect, useMemo } from "react";
import socket from "../src/socket";
import ReviewModal from "./ReviewModal";
import RequestModal from "./RequestModal";
import { MdReport } from "react-icons/md";

const getId = (obj) => obj?.id || obj?._id || "";
const looksLikeObjectId = (v) => typeof v === "string" && /^[a-f\d]{24}$/i.test(v);

const Chat = ({
  currentUser,
  recipient,
  listing,
  isModal = true,
  initialMessages = [],
  conversationId,
  onSend, // optional callback
}) => {
  // -------- IDs (derived) --------
  const senderId = getId(currentUser);
  const recipientId = getId(recipient);
  const rawListingId = getId(listing);

  // Use a *safe* listing id so we never hit the backend with garbage (e.g., "nearby")
  const safeListingId = useMemo(
    () => (looksLikeObjectId(rawListingId) ? rawListingId : null),
    [rawListingId]
  );

  // -------- State --------
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState(initialMessages);
  const [roomId, setRoomId] = useState("");
  const [file, setFile] = useState(null);

  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [canReview, setCanReview] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Request / permission state
  const [hasPermissionToChat, setHasPermissionToChat] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null); // "accepted" | "pending" | "none" | null
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState("");

  // -------- Effects (ALWAYS top-level; conditionals go INSIDE) --------

  // Check if user has permission to chat
  useEffect(() => {
    let abort = false;

    async function checkChatPermission() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        // Existing conversation → allowed
        if (conversationId) {
          if (!abort) {
            setHasPermissionToChat(true);
            setRequestStatus("existing");
            setPermissionError("");
          }
          return;
        }

        // For NEW conversation, we must have valid ObjectIds to hit the API
        if (!recipientId) {
          if (!abort) {
            setHasPermissionToChat(false);
            setRequestStatus(null);
            setPermissionError("Missing recipient.");
          }
          return;
        }
        if (!safeListingId) {
          if (!abort) {
            setHasPermissionToChat(false);
            setRequestStatus("none");
            setPermissionError("This conversation needs a valid listing to start.");
          }
          return;
        }

        const res = await fetch(
          `http://localhost:3000/requests/can-send/${recipientId}/${safeListingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();

        if (abort) return;

        if (data.existingRequest?.status === "accepted") {
          setHasPermissionToChat(true);
          setRequestStatus("accepted");
          setPermissionError("");
        } else if (data.existingRequest?.status === "pending") {
          setHasPermissionToChat(false);
          setRequestStatus("pending");
          setPermissionError(`You have a pending request. Please wait for ${recipient?.name}.`);
        } else if (data.canSend) {
          setHasPermissionToChat(false);
          setRequestStatus("none");
          setPermissionError(`You need to send a connection request to ${recipient?.name} before you can chat.`);
        } else {
          setHasPermissionToChat(false);
          setRequestStatus(null);
          setPermissionError(data.reason || "Cannot start conversation.");
        }
      } catch (err) {
        if (!abort) {
          console.error(err);
          setHasPermissionToChat(false);
          setRequestStatus(null);
          setPermissionError("Unable to verify chat permissions.");
        }
      } finally {
        if (!abort) setLoading(false);
      }
    }

    checkChatPermission();
    return () => {
      abort = true;
    };
  }, [recipientId, safeListingId, conversationId, recipient?.name]);

  // Socket debug (active only if allowed)
  useEffect(() => {
    if (!hasPermissionToChat) return;
    const onConnect = () => console.log("Socket connected:", socket.id);
    const onDisconnect = () => console.log("Socket disconnected");
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [hasPermissionToChat]);

  // Join room (sender+recipient based)
  useEffect(() => {
    if (!hasPermissionToChat || !senderId || !recipientId) return;
    const ids = [senderId, recipientId].sort();
    const room = `room_${ids.join("_")}`;
    setRoomId(room);
    socket.emit("join_room", room);

    if (chatHistory.length >= 3) {
      // review eligibility after a little conversation
      checkReviewEligibility();
    }

    return () => {
      // optional: leave the room when unmounting or losing permission
      socket.emit("leave_room", room);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermissionToChat, senderId, recipientId]);

  // Load history (server) for existing conversations
  useEffect(() => {
    let abort = false;
    if (!hasPermissionToChat || !conversationId) return;

    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:3000/messages?conversationId=${conversationId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (abort) return;
        const msgs = (data.messages || []).map((msg) => ({
          _id: msg._id,
          content: msg.content,
          senderId: getId(msg.sender),
          senderName: msg.sender?.name,
          timestamp: msg.createdAt,
        }));
        setChatHistory(msgs);
      } catch (e) {
        if (!abort) console.error(e);
      }
    })();

    return () => {
      abort = true;
    };
  }, [conversationId, hasPermissionToChat]);

  // Receive new messages (SSE/Socket)
  useEffect(() => {
    if (!hasPermissionToChat) return;

    const receiveHandler = (data) => {
      if (data.conversationId === conversationId && data.senderId !== senderId) {
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

    socket.on("receive_private_message", receiveHandler);
    return () => socket.off("receive_private_message", receiveHandler);
  }, [conversationId, senderId, hasPermissionToChat]);

  // -------- Handlers --------

  const handleSend = () => {
    if (!roomId || !hasPermissionToChat) return;
    const timestamp = new Date().toISOString();

    // Text
    if (message.trim()) {
      const msgData = {
        room: roomId,
        senderId,
        recipientId,
        listingId: safeListingId || undefined, // never send "nearby"
        message: message.trim(),
        senderName: currentUser?.name,
        conversationId,
      };
      socket.emit("send_private_message", msgData);
      setChatHistory((prev) => [
        ...prev,
        {
          _id: Date.now().toString(),
          content: message.trim(),
          senderId,
          senderName: currentUser?.name,
          timestamp,
        },
      ]);
    }

    // File
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = reader.result.split(",")[1];
        const fileMsg = {
          senderId,
          recipientId,
          listingId: safeListingId || undefined,
          fileName: file.name,
          fileData,
          fileType: file.type,
          senderName: currentUser?.name,
          conversationId,
        };
        socket.emit("send_file_message", fileMsg);
        setChatHistory((prev) => [
          ...prev,
          {
            _id: `${Date.now().toString()}-file`,
            content: `file://${file.name}`,
            senderId,
            senderName: currentUser?.name,
            timestamp,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }

    setMessage("");
    setFile(null);

    if (typeof onSend === "function") onSend();
  };

  const handleRequestSent = () => {
    setShowRequestModal(false);
    setRequestStatus("pending");
    setPermissionError(`Request sent to ${recipient?.name}.`);
  };

  const checkReviewEligibility = async () => {
    try {
      const token = localStorage.getItem("token");
      // Only check if we have valid IDs
      if (!recipientId || !safeListingId) return;
      const res = await fetch(
        `http://localhost:3000/reviews/can-review/${recipientId}/${safeListingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setCanReview(Boolean(data.canReview));
      if (data.canReview) setShowReviewPrompt(true);
    } catch (err) {
      console.error(err);
    }
  };

  // -------- Rendering --------

  // Loading state
  if (loading) {
    return (
      <div className="d-flex flex-column h-100 border rounded shadow-sm">
        <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4">
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-muted">Checking permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  // No permission UI (includes invalid listing id case)
  if (!hasPermissionToChat) {
    return (
      <div className="d-flex flex-column h-100 border rounded shadow-sm">
        <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4">
          <div className="text-center">
            <i className="bi bi-chat-x display-1 text-muted mb-4"></i>
            <h5>Connection Required</h5>
            <p className="text-muted">{permissionError}</p>

            {/* Only show request button when the server said "you can send" AND we have a valid listing id */}
            {requestStatus === "none" && safeListingId && (
              <button className="btn btn-primary" onClick={() => setShowRequestModal(true)}>
                <i className="bi bi-person-plus me-2" />
                Send Connection Request
              </button>
            )}

            {requestStatus === "pending" && (
              <div className="alert alert-warning mt-3">
                <i className="bi bi-clock me-2" />
                Request Pending
                <br />
                <small>Waiting for {recipient?.name} to respond to your request.</small>
              </div>
            )}
          </div>
        </div>

        {showRequestModal && (
          <RequestModal
            isOpen={showRequestModal}
            onClose={() => setShowRequestModal(false)}
            recipient={{ id: recipientId, name: recipient?.name }}
            listing={{ id: safeListingId, title: listing?.title }}
            onRequestSent={handleRequestSent}
          />
        )}
      </div>
    );
  }

  // Main chat UI
  return (
    <div className="d-flex flex-column h-100 border rounded shadow-sm">
      <div className="flex-grow-1 overflow-auto p-4 bg-white" style={{ maxHeight: "500px" }}>
        {chatHistory.length === 0 ? (
          <div className="text-center text-muted mt-5">
            <i className="bi bi-chat-dots display-4 mb-3"></i>
            <h6>Start your conversation with {recipient?.name}</h6>
            <p>Type a message below to begin chatting.</p>
          </div>
        ) : (
          chatHistory.map((msg) => {
            const outgoing = msg.senderId === senderId;
            return (
              <div
                key={msg._id}
                className={`mb-4 d-flex ${outgoing ? "justify-content-end" : "justify-content-start"} position-relative`}
              >
                {!outgoing && (
                  <button
                    className="btn btn-light btn-sm position-absolute top-0 start-100 translate-middle"
                    onClick={() => (setShowReportModal(true), setSelectedMessage(msg))}
                    title="Report"
                  >
                    <MdReport size={18} color="red" />
                  </button>
                )}
                <div
                  className={`p-3 rounded-3 shadow-sm ${outgoing ? "bg-primary text-white" : "bg-light text-dark"}`}
                  style={{ maxWidth: "70%" }}
                >
                  <div className="small fw-semibold mb-1">{outgoing ? "You" : msg.senderName}</div>
                  <div>
                    {String(msg.content).startsWith("file://") ? (
                      <a
                        href={`http://localhost:3000/uploads/${String(msg.content).replace("file://", "")}`}
                        download
                      >
                        📎 {String(msg.content).replace("file://", "")}
                      </a>
                    ) : (
                      msg.content
                    )}
                  </div>
                  <div className="text-end text-muted mt-2" style={{ fontSize: "0.75rem" }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && selectedMessage && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Report Message</h5>
                <button type="button" className="btn-close" onClick={() => setShowReportModal(false)}></button>
              </div>
              <div className="modal-body">
                <textarea className="form-control" rows="3" id="reportReason" placeholder="Reason for reporting" />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowReportModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={async () => {
                    const reason = document.getElementById("reportReason").value;
                    if (!reason) return alert("Please enter a reason.");
                    const token = localStorage.getItem("token");
                    const res = await fetch(
                      `http://localhost:3000/messages/${selectedMessage._id}/report`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ reason }),
                      }
                    );
                    if (res.ok) {
                      alert("Reported.");
                      setShowReportModal(false);
                    } else {
                      const err = await res.json();
                      alert(err.error || "Failed to report.");
                    }
                  }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Input */}
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
            type="text"
            className="form-control rounded-start-pill px-4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && roomId && hasPermissionToChat && handleSend()}
            placeholder="Type your message..."
          />
          <button
            className="btn btn-primary rounded-end-pill px-4"
            onClick={handleSend}
            disabled={(!message.trim() && !file) || !roomId || !hasPermissionToChat}
          >
            Send
          </button>
        </div>

        {showReviewPrompt && canReview && (
          <div className="border-top p-3 bg-info bg-opacity-10">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="mb-1">
                  <i className="bi bi-star me-2"></i> How was your experience?
                </h6>
                <small className="text-muted">Share feedback for {recipient?.name}</small>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowReviewPrompt(false)}>
                  Later
                </button>
                <button className="btn btn-sm btn-primary" onClick={() => setShowReviewModal(true)}>
                  <i className="bi bi-star me-1"></i> Write Review
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
          onReviewSubmitted={() => {
            setShowReviewModal(false);
            setShowReviewPrompt(false);
            setCanReview(false);
          }}
        />
      </div>
    </div>
  );
};

export default Chat;
