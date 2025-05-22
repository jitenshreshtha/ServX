import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Footer() {
  return (
    <footer
      className="text-white mt-auto pt-4"
      style={{ 
        backgroundColor: '#0866C4', 
        fontFamily: "'Lexend Deca', sans-serif",
        width: '100%'
      }}
    >
      <div className="container-fluid px-3 mx-0">
        
        <div className="d-flex flex-nowrap align-items-center justify-content-between mb-4">
          {/* Logo */}
          <div className="d-flex align-items-center flex-shrink-0">
            <img
              src="/logo.png"
              alt="Logo ServX"
              style={{ height: '50px', borderRadius: '12px' }}
              className="me-3"
            />
            <div>
              <h4 className="mb-0">ServX</h4>
              <small>Give and Get!</small>
            </div>
          </div>
          
          {/* First text*/}
          <p className="lead mb-0 mx-4 text-nowrap flex-grow-1 text-center">
            Share your unique skills in our community skill exchange platform.
          </p>
          
          <div className="flex-shrink-0" style={{ width: '160px' }}></div>
        </div>

        {/*  social icons and second section */}
        <div className="d-flex flex-nowrap align-items-center justify-content-between">
          {/* Social icons */}
          <div className="d-flex gap-3 fs-4 flex-shrink-0">
            <a href="#" className="text-white"><i className="bi bi-facebook"></i></a>
            <a href="#" className="text-white"><i className="bi bi-twitter"></i></a>
            <a href="#" className="text-white"><i className="bi bi-instagram"></i></a>
            <a href="#" className="text-white"><i className="bi bi-linkedin"></i></a>
          </div>
          
          {/* text */}
          <p className="mb-0 mx-4 text-nowrap flex-grow-1 text-center">
            Connect with us on Social Media and share your valuable feedback!
          </p>
          
          <div className="flex-shrink-0" style={{ width: '160px' }}></div>
        </div>
        <div className="text-center border-top border-white border-opacity-25 pt-2 pb-3 mt-3">
          <small>&copy; 2025 ServX. All rights reserved.</small>
        </div>
      </div>
    </footer>
  );
}

export default Footer;