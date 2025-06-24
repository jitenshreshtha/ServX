import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Pagination from "../components/Pagination";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../src/context/Authcontext';
import "bootstrap/dist/css/bootstrap.min.css";

function Homepage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalListings, setTotalListings] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [filters, setFilters] = useState({
    skillWanted: "",
    locationQuery: ""
  });

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, [currentPage]);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    setLoggedIn(!!token);
  };

  useEffect(() => {
    checkLoginStatus();
    const handleLoginStateChange = () => checkLoginStatus();
    window.addEventListener('loginStateChange', handleLoginStateChange);
    return () => window.removeEventListener('loginStateChange', handleLoginStateChange);
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage);
      queryParams.append('limit', itemsPerPage);
      if (filters.skillWanted) queryParams.append("skillWanted", filters.skillWanted);
      if (filters.locationQuery) queryParams.append("location", filters.locationQuery);

      const response = await fetch(`http://localhost:3000/listings?${queryParams}`);
      const data = await response.json();

      setListings(data.listings || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalListings(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching listings:", error);
      setListings([]);
      setTotalPages(1);
      setTotalListings(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchListings();
  };

  const handleContactClick = (listing) => {
    if (!listing || !listing.author || !listing.author._id || !listing._id) {
      alert("Cannot contact: missing author or listing info");
      return;
    }

    navigate("/inbox", {
      state: {
        recipient: {
          id: listing.author._id,
          name: listing.author.name,
        },
        listing: {
          id: listing._id,
          title: listing.title,
        },
      },
    });
  };

  return (
    <div>
      <Header />
      <div className="bg-primary text-white py-5">
        <div className="container text-center">
          <h1 className="display-4 fw-bold mb-3">Welcome to ServX</h1>
          <p className="lead mb-4">Exchange skills, share knowledge, and build your community</p>
          <button
            className="btn btn-light btn-lg"
            onClick={() => {
              if (!loggedIn) navigate('/login');
              else navigate('/create-listing');
            }}
          >
            <i className="bi bi-plus-circle me-2"></i>
            {loggedIn ? 'Create Your Listing' : 'Login to Create Listing'}
          </button>
          {!loggedIn && (
            <div className="mt-3">
              <small className="text-light">
                <Link to="/signup" className="text-light text-decoration-underline">
                  New user? Sign up here
                </Link>
              </small>
            </div>
          )}
        </div>
      </div>

      {/* Search UI */}
      <div className="container mt-4 mb-3">
        <div className="row g-2">
          <div className="col-md-5">
            <input type="text" className="form-control" placeholder="Skill Wanted"
              value={filters.skillWanted}
              onChange={(e) => setFilters({ ...filters, skillWanted: e.target.value })}
            />
          </div>
          <div className="col-md-5">
            <input type="text" className="form-control" placeholder="Location"
              value={filters.locationQuery}
              onChange={(e) => setFilters({ ...filters, locationQuery: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100" onClick={handleSearch}>Search</button>
          </div>
        </div>
      </div>

      <div className="container my-5">
        <h3>Skill Exchange Listings</h3>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : (
          <div className="row">
            {listings.map((listing) => (
              <div className="col-lg-6 mb-4" key={listing._id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">{listing.title}</h5>
                    <p className="text-muted">{listing.description?.slice(0, 100)}...</p>
                    <small className="text-muted">By {listing.author?.name}</small>
                  </div>
                  <div className="card-footer bg-transparent">
                    {loggedIn ? (
                      <button className="btn btn-primary btn-sm w-100" onClick={() => handleContactClick(listing)}>
                        <i className="bi bi-chat-dots me-2"></i>Contact
                      </button>
                    ) : (
                      <button
                        className="btn btn-outline-primary btn-sm w-100"
                        onClick={() => {
                          alert('Please login to contact the author!');
                          navigate('/login');
                        }}
                      >
                        <i className="bi bi-box-arrow-in-right me-2"></i>Login to Contact
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Homepage;
