// src/components/AuthCallback.jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../src/context/Authcontext';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        if (!token) throw new Error('Authentication failed: No token received');
        
        // Store token
        localStorage.setItem('token', token);
        
        // Fetch user data
        const response = await fetch('http://localhost:3000/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch user data');
        
        const { user } = await response.json();
        localStorage.setItem('user', JSON.stringify(user));
        login(user);
        
        // Always redirect to home page after successful login
        const redirectPath = sessionStorage.getItem('preAuthPath') || '/';
        sessionStorage.removeItem('preAuthPath');
        navigate(redirectPath, { replace: true });
        
      } catch (err) {
        console.error('Auth callback error:', err);
        navigate('/login', { state: { error: error || err.message } });
      }
    };

    if (token) handleAuthSuccess();
    else if (error) navigate('/login', { state: { error: decodeURIComponent(error) } });
  }, [token, error, navigate, login]);

  return (
    <div className="container text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3">Completing authentication...</p>
    </div>
  );
}

export default AuthCallback;