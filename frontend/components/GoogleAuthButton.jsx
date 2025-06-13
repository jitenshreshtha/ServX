// src/components/GoogleAuthButton.jsx
import React from 'react';

function GoogleAuthButton({ className }) {
  const handleGoogleLogin = () => {
    // Redirect user to backend Google OAuth route
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <button className={className} onClick={handleGoogleLogin}>
      Continue with Google
    </button>
  );
}

export default GoogleAuthButton;
