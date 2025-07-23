import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MapView from '../components/MapView';

function MapPage() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1">
        <MapView />
      </main>
      <Footer />
    </div>
  );
}

export default MapPage;