import React from 'react'
import CreateListing from '../components/CreateListing';
import Header from '../components/Header';
import Footer from '../components/Footer';

function CreateListingPage() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1">
        <CreateListing />
      </main>
      <Footer />
    </div>
  )
}

export default CreateListingPage