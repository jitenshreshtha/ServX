// src/components/NotificationHandler.jsx
import React, { useState, useEffect } from "react";
import socket from "../src/socket";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const NotificationHandler = ({ currentUser }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    // ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    // join user's private room
    socket.emit("join_user_room", currentUser.id);

    const handleNewMessage = (data) => {
      setUnreadCount((c) => c + 1);
      toast.info(`New message from ${data.senderName}`);
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [currentUser]);

  return (
    <>
      {unreadCount > 0 && (
      <div className="alert alert-info text-center">
        You have {unreadCount} new message{unreadCount > 1 ? "s" : ""}
      </div>
    )}
    <ToastContainer position="top-right" autoClose={4000} />
    </>
  );
};

export default NotificationHandler;
