import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RequestsPage from '../components/RequestsPage';

function RequestsPageWrapper() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1 bg-light">
        <RequestsPage />
      </main>
      <Footer />
    </div>
  );
}

export default RequestsPageWrapper;