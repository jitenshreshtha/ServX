// src/components/Inbox.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../src/context/Authcontext";
import { useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import socket from "../src/socket";
import Chat from "./Chat";

const Inbox = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [error, setError] = useState(null);

  // Unread banner count
  const [unreadCount, setUnreadCount] = useState(0);

  // 1) Fetch all conversations for this user
  useEffect(() => {
    if (!currentUser) return;
    const fetchConvos = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(
          "http://localhost:3000/conversations/user",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to load conversations");
        const data = await res.json();
        // ensure array
        if (Array.isArray(data)) {
          setConversations(data);
        } else {
          setConversations([]);
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchConvos();
  }, [currentUser]);

  // 2) Auto-select the first conversation when list loads (unless we're starting a new one)
  useEffect(() => {
    if (
      !selectedConversation &&
      Array.isArray(conversations) &&
      conversations.length > 0 &&
      !location.state
    ) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, location.state, selectedConversation]);

  // 3) If navigating here with a recipient+listing in state, start (or resume) that convo
  useEffect(() => {
    if (!currentUser) return;
    const { recipient, listing } = location.state || {};
    if (!recipient || !listing) return;

    const startConvo = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const params = new URLSearchParams({
          user1: currentUser.id,
          user2: recipient.id,
          listing: listing.id,
        });
        const res = await fetch(
          `http://localhost:3000/conversations?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const { conversation } = await res.json();
        // set it as selected
        setSelectedConversation(conversation);

        // refresh list
        const convRes = await fetch(
          "http://localhost:3000/conversations/user",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (convRes.ok) {
          const updated = await convRes.json();
          if (Array.isArray(updated)) setConversations(updated);
        }
      } catch (err) {
        console.error("Failed to start conversation:", err);
      }
    };
    startConvo();
  }, [location.state, currentUser]);

  // 4) Join user room & listen for incoming messages
  useEffect(() => {
    if (!currentUser) return;
    socket.connect();
    socket.emit("join_user_room", currentUser.id);

    const handleNew = (data) => {
      // bump banner count
      setUnreadCount((c) => c + 1);
      // show toast
      toast.info(`New message from ${data.senderName}`);
    };
    socket.on("new_message", handleNew);

    return () => {
      socket.off("new_message", handleNew);
    };
  }, [currentUser]);

  // Helper to grab the “other” participant
  const getOther = (participants) =>
    Array.isArray(participants)
      ? participants.find((p) => p._id !== currentUser?.id)
      : null;

  return (
    <div className="container py-4">
      <h2>Inbox</h2>

      {/* 1) Toasts */}
      <ToastContainer position="top-right" autoClose={4000} />

      {/* 2) In-app banner */}
      {unreadCount > 0 && (
        <div className="alert alert-info text-center">
          You have {unreadCount} new message
          {unreadCount > 1 ? "s" : ""}
        </div>
      )}

      {/* 3) Error */}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mt-3">
        {/* Conversations list */}
        <div className="col-md-4">
          <div className="list-group">
            {conversations.map((conv) => {
              const other = getOther(conv.participants);
              return (
                <button
                  key={conv._id}
                  className={`list-group-item list-group-item-action ${
                    selectedConversation?._id === conv._id ? "active" : ""
                  }`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <strong>{other?.name || "—"}</strong>
                  <br />
                  <small>{conv.listing?.title || ""}</small>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat panel */}
        <div className="col-md-8">
          {selectedConversation ? (
            <Chat
              currentUser={currentUser}
              recipient={getOther(
                selectedConversation.participants
              )}
              listing={{
                id:
                  selectedConversation.listing?.id ||
                  selectedConversation.listing?._id ||
                  "",
                title: selectedConversation.listing?.title || "",
              }}
              conversationId={selectedConversation._id}
              isModal={false}
              initialMessages={selectedConversation.messages || []}
              // Reset banner count when user replies
              onSend={() => setUnreadCount(0)}
            />
          ) : (
            <div className="alert alert-info">Select a conversation</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
