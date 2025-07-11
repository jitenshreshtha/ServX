import React from 'react';
import Header from '../components/Header';    // adjust path as needed
import Footer from '../components/Footer';    // adjust path as needed
import ReportedMessages from "../components/ReportMessages";


const AdminReportedMessagesPage = () => (
  <div>
    <Header />
    <div className="container my-5">
      <ReportedMessages />
    </div>
    <Footer />
  </div>
);

export default AdminReportedMessagesPage;
