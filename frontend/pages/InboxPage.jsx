import React from 'react';
import Header from "../components/Header";
import Footer from "../components/Footer";
import Inbox from "../components/Inbox";

function InboxPage() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1 bg-light">
        <Inbox />
      </main>
      <Footer />
    </div>
  );
}

export default InboxPage;