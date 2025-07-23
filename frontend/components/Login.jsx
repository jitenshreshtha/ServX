import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import GoogleAuthButton from './GoogleAuthButton';

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [mfaStage, setMfaStage] = useState("login"); // "login" or "otp"
  const [pendingUserId, setPendingUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  // Get the page user tried to access before login
  const from = location.state?.from?.pathname || '/';

  // Validate login form fields
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password.trim()) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 1: Handle login submit (email/password)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Login failed");

      if (data.requires2FA) {
        // 2FA needed!
        setPendingUserId(data.userId);
        setMfaStage("otp");
        setLoading(false);
        return;
      }

      // Normal login: store JWT/user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("isLoggedIn", "true");
      window.dispatchEvent(new Event('loginStateChange'));
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP verification
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const response = await fetch("http://localhost:3000/2fa/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingUserId, token: otp }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Invalid code");

      // Success: store JWT/user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("isLoggedIn", "true");
      window.dispatchEvent(new Event('loginStateChange'));
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <div className="card shadow">
        <div className="card-body p-4">
          <h2 className="mb-4 text-center">Login</h2>

          {errors.general && (
            <div className="alert alert-danger">{errors.general}</div>
          )}

          {location.state?.from && (
            <div className="alert alert-info" role="alert">
              <i className="bi bi-info-circle me-2"></i>
              Please login to access the requested page.
            </div>
          )}

          {mfaStage === "login" ? (
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
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
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
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <div className="mb-3">
                <label htmlFor="otp" className="form-label">
                  Authenticator Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={6}
                  className="form-control"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                  autoFocus
                  placeholder="Enter 6-digit code"
                />
              </div>
              <button
                type="submit"
                className="btn btn-success w-100"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          )}

          <div className="d-flex align-items-center my-3">
            <hr className="flex-grow-1" />
            <span className="mx-2 text-muted">OR</span>
            <hr className="flex-grow-1" />
          </div>

          <GoogleAuthButton className="w-100" />

          <div className="text-center mt-3">
            <span>Don't have an account? </span>
            <Link to="/signup" className="text-decoration-none">
              Sign up here
            </Link>
          </div>
          <div className="text-center mt-3">
            <hr />
            <small className="text-muted">
              Quick Demo: Use any email and password to test (for development)
            </small>
          </div>
        </div>
        <div className="text-center mt-3">
          <hr />
          <span>Are you an admin? </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary ms-2"
            onClick={() => navigate("/admin-login")}
          >
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
