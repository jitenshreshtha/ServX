import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkLoginStatus();
    
    // Listen for login state changes
    const handleLoginStateChange = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('loginStateChange', handleLoginStateChange);
    
    return () => {
      window.removeEventListener('loginStateChange', handleLoginStateChange);
    };
  }, []);

  const checkLoginStatus = () => {
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    // Check admin status first
    if (adminToken) {
      setLoggedIn(true);
      setIsAdmin(true);
      setUser({ name: 'Admin' }); // Default admin name
      return;
    }
    
    // Check regular user status
    if (userToken && userData) {
      setLoggedIn(true);
      setUser(JSON.parse(userData));
      setIsAdmin(false);
    } else {
      setLoggedIn(false);
      setUser(null);
      setIsAdmin(false);
    }
  };

  const handleLogout = () => {
    if (isAdmin) {
      localStorage.removeItem('adminToken');
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    localStorage.removeItem('isLoggedIn');
    setLoggedIn(false);
    setUser(null);
    setIsAdmin(false);
    
    // Trigger login state change event
    window.dispatchEvent(new Event('loginStateChange'));
    
    navigate('/');
  };

  const handleCreateListingClick = (e) => {
    if (!loggedIn) {
      e.preventDefault();
      alert('Please login first to create a listing!');
      navigate('/login');
    }
  };

  return (
    <header className="bg-primary text-white shadow-sm w-100" style={{ fontFamily: "'Lexend Deca', sans-serif" }}>
      <div className="container-fluid d-flex justify-content-between align-items-center py-3">
        {/* Logo */}
        <div className="ms-3">
          <Link to="/">
            <img src="/logo.png" alt="Logo" style={{ height: '50px', borderRadius: '12px' }} />
          </Link>
        </div>

        {/* Project Title */}
        <div className="text-center flex-grow-1" style={{ fontSize: '2.8rem', fontWeight: '700', letterSpacing: '1px' }}>
          <Link to="/" className="text-white text-decoration-none">ServX</Link>
        </div>

        {/* Profile / Login Links */}
        <div className="me-3">
          {(loggedIn || isAdmin) ? (
            <div className="dropdown">
              <button
                className="dropdown-toggle d-flex align-items-center p-0 bg-transparent border-0"
                type="button"
                id="profileDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                <img
                  src="/profile.png"
                  alt="Profile"
                  className="rounded-circle me-2"
                  style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                />
                <span>{isAdmin ? 'Admin' : user?.name || 'User'}</span>
              </button>

              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
                {isAdmin ? (
                  <>
                    <li>
                      <Link className="dropdown-item" to="/admin-dashboard">
                        <i className="bi bi-speedometer2 me-2"></i>Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/admin/settings">
                        <i className="bi bi-gear me-2"></i>Settings
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link className="dropdown-item" to="/profile">
                        <i className="bi bi-person me-2"></i>Profile
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/my-listings">
                        <i className="bi bi-list-ul me-2"></i>My Listings
                      </Link>
                    </li>
                  </>
                )}
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>Logout
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="dropdown">
              <a
                className="dropdown-toggle text-white text-decoration-none"
                href="#"
                role="button"
                id="dropdownMenuLink"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ fontWeight: '500' }}
              >
                Login/Signup
              </a>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuLink">
                <li>
                  <Link className="dropdown-item" to="/login">
                    <i className="bi bi-box-arrow-in-right me-2"></i>Login
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/signup">
                    <i className="bi bi-person-plus me-2"></i>Signup
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/admin-login">
                    <i className="bi bi-shield-lock me-2"></i>Admin Login
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-white border-bottom border-primary border-4">
        <div className="container d-flex justify-content-center gap-5 py-2 fs-5">
          <NavLink to="/" label="Home" />
          <NavLink to="/about" label="About Us" />
          <NavLink to="/contact" label="Contact Us" />
          
          {/* Show Create Listing only for regular logged-in users */}
          {loggedIn && !isAdmin ? (
            <NavLink to="/create-listing" label="Create Listing" />
          ) : !loggedIn ? (
            <a
              href="#"
              onClick={handleCreateListingClick}
              style={{
                color: 'black',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={(e) => (e.target.style.color = '#0866C4')}
              onMouseLeave={(e) => (e.target.style.color = 'black')}
            >
              Create Listing
            </a>
          ) : null}
        </div>
      </nav>
    </header>
  );
}

function NavLink({ to, label }) {
  const baseStyle = {
    color: 'black',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.3s ease',
  };

  return (
    <Link
      to={to}
      style={baseStyle}
      onMouseEnter={(e) => (e.target.style.color = '#0866C4')}
      onMouseLeave={(e) => (e.target.style.color = 'black')}
    >
      {label}
    </Link>
  );
}

export default Header;