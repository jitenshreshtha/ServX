import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MyListings from '../components/MyListings';

function MyListingsPage() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1 bg-light">
        <MyListings />
      </main>
      <Footer />
    </div>
  );
}

export default MyListingsPage;