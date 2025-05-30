import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("request"); 
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  const API_BASE = "http://localhost:3000";


  // Request OTP
  const handleRequestOTP = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/request-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      alert("OTP sent to your email");
      setStep("verify");
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };

  // Update handleVerifyOTP to redirect
  const handleVerifyOTP = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP verification failed");

      localStorage.setItem("adminToken", data.token);
      navigate('/admin-dashboard'); 
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "1rem" }}>
      <h2>Admin Login</h2>

      {step === "request" && (
        <>
          <input
            type="email"
            placeholder="Enter admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          />
          <button onClick={handleRequestOTP} style={{ width: "100%" }}>
            Send OTP
          </button>
        </>
      )}

      {step === "verify" && (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{ width: "100%", padding: "8px", marginBottom: "10px", marginTop: "10px" }}
          />
          <button onClick={handleVerifyOTP} style={{ width: "100%" }}>
            Verify OTP
          </button>
        </>
      )}

      {token && (
        <p style={{ color: "green", marginTop: "10px" }}>
          ✅ Admin logged in successfully
        </p>
      )}
    </div>
  );
};

export default AdminLogin;
