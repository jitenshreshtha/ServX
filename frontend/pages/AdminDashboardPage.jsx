import React from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import AdminDashboard from "../components/AdminDashboard";

function AdminDashboardPage() {
  return (
    <div>
      <Header />
      <AdminDashboard />
      <Footer />
    </div>
  );
};

export default AdminDashboardPage;