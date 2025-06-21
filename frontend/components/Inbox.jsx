import React, { useState, useEffect } from "react";
import { useAuth } from "../src/context/Authcontext";
import { useLocation } from "react-router-dom";
import Chat from "./Chat";

const Inbox = () => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchConversations = async () => {
      const token = localStorage.getItem("token");
      if (!token || !currentUser) return;

      try {
        const res = await fetch("http://localhost:3000/conversations/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setConversations(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load conversations");
      }
    };

    fetchConversations();
  }, [currentUser]);

  // Auto-start conversation if arriving from 'Contact' button
  useEffect(() => {
    const startNewConversation = async () => {
      const token = localStorage.getItem("token");
      const { recipient, listing } = location.state || {};

      if (!recipient || !listing || !currentUser || !token) return;

      try {
        const query = new URLSearchParams({
          user1: currentUser.id,
          user2: recipient.id,
          listing: listing.id,
        });

        const res = await fetch(`http://localhost:3000/conversations?${query.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { conversation } = await res.json();

        setSelectedConversation({
          ...conversation,
          participants: [
            { _id: currentUser.id, name: currentUser.name },
            { _id: recipient.id, name: recipient.name },
          ],
          listing,
          messages: [], // messages will be loaded in Chat.jsx
        });

        // Reload all conversations to include the new one
        const convRes = await fetch("http://localhost:3000/conversations/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const convs = await convRes.json();
        setConversations(convs);
      } catch (err) {
        console.error("Failed to start conversation:", err);
      }
    };

    startNewConversation();
  }, [location.state, currentUser]);

  const getOtherParticipant = (participants) =>
    participants?.find((p) => p._id !== currentUser?.id);

  return (
    <div className="container py-4">
      <h2>Inbox</h2>
      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="row">
          <div className="col-md-4">
            <div className="list-group">
              {conversations.map((conv) => {
                const other = getOtherParticipant(conv.participants);
                return (
                  <button
                    key={conv._id}
                    className={`list-group-item list-group-item-action ${
                      selectedConversation?._id === conv._id ? "active" : ""
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <strong>{other?.name}</strong>
                    <br />
                    <small>{conv.listing?.title}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="col-md-8">
            {selectedConversation ? (
              <Chat
                currentUser={currentUser}
                recipient={{
                  id: getOtherParticipant(selectedConversation.participants)?._id,
                  name: getOtherParticipant(selectedConversation.participants)?.name,
                }}
                listing={{
                  id: selectedConversation.listing?._id,
                  title: selectedConversation.listing?.title,
                }}
                conversationId={selectedConversation._id}
                isModal={false}
                initialMessages={selectedConversation.messages || []}
              />
            ) : (
              <div className="alert alert-info">Select a conversation</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbox;
