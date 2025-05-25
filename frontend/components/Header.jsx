import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setLoggedIn(isLoggedIn);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setLoggedIn(false);
    navigate('/login');
  };

  return (
    <header className="bg-primary text-white shadow-sm w-100" style={{ fontFamily: "'Lexend Deca', sans-serif" }}>
      <div className="container-fluid d-flex justify-content-between align-items-center py-3">
        {/* Logo */}
        <div className="ms-3">
          <img src="/logo.png" alt="Logo" style={{ height: '50px', borderRadius: '12px' }} />
        </div>

        {/* Project Title */}
        <div className="text-center flex-grow-1" style={{ fontSize: '2.8rem', fontWeight: '700', letterSpacing: '1px' }}>
          ServX
        </div>

        {/* Profile / Login Links */}
        <div className="me-3">
          {loggedIn ? (
            <div className="dropdown">
              <button
                className="dropdown-toggle d-flex align-items-center p-0"
                type="button"
                id="profileDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{
                  width: '55px',
                  height: '55px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  cursor: 'pointer',
                }}
              >
                <img
                  src="/profile.png"
                  alt="Profile"
                  className="rounded-circle"
                  style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                />
              </button>

              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
                <li>
                  <Link className="dropdown-item" to="/edit-profile">
                    Edit Profile
                  </Link>
                </li>
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="dropdown">
              <a
                className="dropdown-toggle text-dark text-decoration-none"
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
                    Login
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/signup">
                    Signup
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
          <NavLink href="/" label="Home" />
          <NavLink href="/about" label="About Us" />
          <NavLink href="/contact" label="Contact Us" />
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, label }) {
  const baseStyle = {
    color: 'black',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.3s ease',
  };

  return (
    <a
      href={href}
      style={baseStyle}
      onMouseEnter={(e) => (e.target.style.color = '#0866C4')}
      onMouseLeave={(e) => (e.target.style.color = 'black')}
    >
      {label}
    </a>
  );
}

export default Header;
