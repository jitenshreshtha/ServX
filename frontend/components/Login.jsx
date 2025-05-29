import React, { useState } from "react";
<<<<<<< HEAD
import { useAuth } from "../src/context/Authcontext";
import { useNavigate, Link } from "react-router-dom";
=======
import { useNavigate, Link, useLocation } from "react-router-dom";
>>>>>>> 32f1c548629b79edbeaf1e81a9faa137da66b696

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
<<<<<<< HEAD
  const { login } = useAuth();
=======
  const location = useLocation();

  // Get the page user tried to access before login
  const from = location.state?.from?.pathname || '/';
>>>>>>> 32f1c548629b79edbeaf1e81a9faa137da66b696

  const handleLogin = async () => {
    // After successful login:
    login({
      id: userData.id,
      name: userData.name,
      email: userData.email,
    });
  };
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password.trim()) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("isLoggedIn", "true");

      alert("Login successful!");
<<<<<<< HEAD
=======
      
      // Trigger header update
      window.dispatchEvent(new Event('loginStateChange'));
      
      // Redirect to original page or home
      navigate(from, { replace: true });
>>>>>>> 32f1c548629b79edbeaf1e81a9faa137da66b696

      handleLogin();
      // Trigger header update
      window.dispatchEvent(new Event("loginStateChange"));

      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <div className="card shadow">
        <div className="card-body p-4">
          <h2 className="mb-4 text-center">Login</h2>
          
          {/* Show message if redirected from protected route */}
          {location.state?.from && (
            <div className="alert alert-info" role="alert">
              <i className="bi bi-info-circle me-2"></i>
              Please login to access the requested page.
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email}</div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className={`form-control ${
                  errors.password ? "is-invalid" : ""
                }`}
                value={formData.password}
                onChange={handleChange}
                required
              />
              {errors.password && (
                <div className="invalid-feedback">{errors.password}</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="text-center mt-3">
            <span>Don't have an account? </span>
            <Link to="/signup" className="text-decoration-none">
              Sign up here
            </Link>
          </div>
          
          {/* Quick demo login (optional - remove in production) */}
          <div className="text-center mt-3">
            <hr />
            <small className="text-muted">
              Quick Demo: Use any email and password to test (for development)
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
