import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SimpleProjects from '../components/SimpleProjects';

function SimpleProjectsPage() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1 bg-light">
        <SimpleProjects />
      </main>
      <Footer />
    </div>
  );
}

export default SimpleProjectsPage;