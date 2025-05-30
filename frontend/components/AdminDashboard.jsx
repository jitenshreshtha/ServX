import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Check admin authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin-login');
    } else {
      // Simulate loading completion
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [navigate]);

  if (loading) {
    return <div>loading the page</div>;
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Dashboard content will go here</p>
    </div>
  );
};

export default AdminDashboard;