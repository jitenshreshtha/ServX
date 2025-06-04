import React, { useState, useEffect } from "react";
import { useAuth } from "../src/context/Authcontext";
import { Link } from "react-router-dom";
import Chat from "./Chat";
import io from "socket.io-client";

const socket = io.connect("http://localhost:3000");

const Inbox = () => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessageNotification, setNewMessageNotification] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("token");
        // Fetch conversations
        const conversationsRes = await fetch(
          `http://localhost:3000/conversations/user`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!conversationsRes.ok) {
          throw new Error(`Server error: ${conversationsRes.status}`);
        }

        const conversationsData = await conversationsRes.json();
        
        // Add messages to each conversation
        const conversationsWithMessages = await Promise.all(
          conversationsData.map(async (conv) => {
            const messagesRes = await fetch(
              `http://localhost:3000/messages?conversationId=${conv._id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (!messagesRes.ok) {
              console.error(`Failed to fetch messages for conversation ${conv._id}`);
              return { ...conv, messages: [] };
            }
            
            const messagesData = await messagesRes.json();
            return { ...conv, messages: messagesData.messages };
          })
        );
        
        setConversations(conversationsWithMessages);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchConversations();

      // Listen for new messages
      const handleNewMessage = (data) => {
        setNewMessageNotification(`New message from ${data.senderName}`);
        
        // Update conversations list
        setConversations(prev => {
          return prev.map(conv => {
            if (conv._id === data.conversationId) {
              // Create a new lastMessage object
              const newLastMessage = {
                _id: data._id || Date.now().toString(), // Temporary ID if not provided
                sender: { _id: data.senderId, name: data.senderName },
                content: data.message,
                createdAt: new Date().toISOString(),
                conversation: data.conversationId
              };
              
              return {
                ...conv,
                lastMessage: newLastMessage,
                messages: [...(conv.messages || []), newLastMessage],
                updatedAt: new Date().toISOString()
              };
            }
            return conv;
          });
        });
      };

      socket.on("new_message", handleNewMessage);

      return () => {
        socket.off("new_message", handleNewMessage);
      };
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      // Join user's room for notifications
      socket.emit("join_user_room", currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedConversation && currentUser) {
      const otherUser = getOtherParticipant(selectedConversation.participants);
      const room = `room_${[currentUser.id, otherUser._id].sort().join("_")}`;
      socket.emit("join_room", room);
    }
  }, [selectedConversation, currentUser]);

  useEffect(() => {
    const handleNewMessage = (data) => {
      if (selectedConversation && data.conversationId === selectedConversation._id) {
        // Update the selected conversation
        setSelectedConversation(prev => {
          const newMessage = {
            _id: data._id || Date.now().toString(), // Temporary ID if not provided
            sender: { _id: data.senderId, name: data.senderName },
            content: data.content,
            createdAt: data.timestamp || new Date().toISOString(),
            conversation: data.conversationId
          };
          
          return {
            ...prev,
            lastMessage: newMessage,
            messages: [...(prev.messages || []), newMessage],
            updatedAt: new Date().toISOString()
          };
        });
      }
    };

    socket.on("receive_private_message", handleNewMessage);

    return () => {
      socket.off("receive_private_message", handleNewMessage);
    };
  }, [selectedConversation]);

  const getOtherParticipant = (participants) => {
    if (!participants || participants.length === 0) return {};
    return participants.find((p) => p._id.toString() !== currentUser.id) || {};
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          <h4>Error Loading Conversations</h4>
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">
        Messages{" "}
        {newMessageNotification && (
          <span className="badge bg-danger ms-2">New!</span>
        )}
      </h2>

      {newMessageNotification && (
        <div className="alert alert-info alert-dismissible fade show">
          {newMessageNotification}
          <button
            type="button"
            className="btn-close"
            onClick={() => setNewMessageNotification(null)}
          ></button>
        </div>
      )}

      <div className="row">
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Conversations</h5>
              <span className="badge bg-primary">{conversations.length}</span>
            </div>

            <div
              className="list-group list-group-flush"
              style={{ maxHeight: "70vh", overflowY: "auto" }}
            >
              {conversations.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-chat-left-text display-4 text-muted mb-3"></i>
                  <p>No conversations yet</p>
                  <Link to="/" className="btn btn-primary mt-2">
                    Browse Listings
                  </Link>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const otherUser = getOtherParticipant(conversation.participants);
                  const isActive = selectedConversation?._id === conversation._id;
                  const lastMessage = conversation.messages?.length > 0 
                    ? conversation.messages[conversation.messages.length - 1] 
                    : null;

                  return (
                    <button
                      key={conversation._id}
                      className={`list-group-item list-group-item-action ${
                        isActive ? "active" : ""
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="text-truncate me-2">
                          <h6 className="mb-1 text-truncate">{otherUser?.name || "Unknown User"}</h6>
                          <small className="text-muted text-truncate d-block">
                            {conversation.listing?.title || "No title"}
                          </small>
                          {lastMessage && (
                            <small className="text-truncate d-block">
                              <strong>
                                {lastMessage.sender?._id === currentUser.id 
                                  ? "You: " 
                                  : `${lastMessage.sender?.name || 'Someone'}: `}
                              </strong>
                              {lastMessage.content}
                            </small>
                          )}
                        </div>
                        <div className="text-end">
                          {lastMessage && (
                            <small className="text-muted">
                              {formatDate(lastMessage.createdAt)}
                            </small>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="col-md-8">
          {selectedConversation ? (
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  Chat with{" "}
                  {getOtherParticipant(selectedConversation.participants)?.name || "User"}
                </h5>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setSelectedConversation(null)}
                >
                  Close
                </button>
              </div>
              <div className="card-body p-0">
                <Chat
                  currentUser={currentUser}
                  recipient={getOtherParticipant(selectedConversation.participants)}
                  listing={selectedConversation.listing}
                  conversationId={selectedConversation._id}
                  isModal={false}
                  initialMessages={selectedConversation.messages || []}
                />
              </div>
            </div>
          ) : (
            <div className="card shadow-sm h-100">
              <div className="card-body d-flex align-items-center justify-content-center">
                <div className="text-center">
                  <i className="bi bi-chat-left-text display-4 text-muted mb-3"></i>
                  <h4>Select a conversation</h4>
                  <p className="text-muted">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;