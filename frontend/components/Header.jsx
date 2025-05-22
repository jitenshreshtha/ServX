import React from 'react';

function Header() {
  return (
    <header className="bg-primary text-white shadow-sm w-100" style={{ fontFamily: "'Lexend Deca', sans-serif" }}>
      
      <div className="container-fluid d-flex justify-content-between align-items-center py-3">
        {/* Logo */}
        <div className="ms-3">
          <img
            src="/logo.png"
            alt="Logo"
            style={{ height: '50px', borderRadius: '12px' }}
          />
        </div>

        {/*  Project Title */}
        <div className="text-center flex-grow-1" style={{ fontSize: '2.8rem', fontWeight: '700', letterSpacing: '1px' }}>
          ServX
        </div>

        {/* Profile Icon */}
        <div className="me-3">
          <img
            src="/profile.png"
            alt="Profile"
            className="rounded-circle"
            style={{ height: '44px', width: '44px', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-white border-bottom border-primary border-4">
        <div className="container d-flex justify-content-center gap-5 py-2 fs-5">
          <NavLink href="/" label="Home" />
          <NavLink href="/about" label="About Us" />
          <NavLink href="/contact" label="Contact Us" />
          
          {/* Dropdown for Login/Signup */}
               <div className="dropdown">
                 <a className="dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-bs-toggle="dropdown" aria-expanded="false" style={{ color: 'black', textDecoration: 'none', fontWeight: '500' }}>Login/Signup </a>
                  <ul className="dropdown-menu" aria-labelledby="dropdownMenuLink">
                    <li><a className="dropdown-item" href="./Login"> Login</a></li>
                    <li><a className="dropdown-item" href="./Signup">Signup</a></li>
                  </ul>
                </div>
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
      onMouseEnter={(e) => e.target.style.color = '#0866C4'}
      onMouseLeave={(e) => e.target.style.color = 'black'}
    >
      {label}
    </a>
  );
}

export default Header;
