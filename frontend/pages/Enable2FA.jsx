import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

function Enable2FA() {
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState("loading"); // "loading" | "start" | "qr" | "verified" | "enabled"
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    setUser(u);
    if (u?.twoFactorEnabled) setStage("enabled");
    else setStage("start");
  }, []);

  // Request QR code from backend
  const start2FA = async () => {
    setError("");
    try {
      const res = await fetch("http://localhost:3000/2fa/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get QR");
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStage("qr");
    } catch (err) {
      setError(err.message);
    }
  };

  // Verify OTP
  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:3000/2fa/verify-setup", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      // Update local user data to reflect 2FA enabled
      const updatedUser = { ...user, twoFactorEnabled: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setStage("verified");
    } catch (err) {
      setError(err.message);
    }
  };

  // Turn off 2FA
  const disable2FA = async () => {
    setError("");
    try {
      const res = await fetch("http://localhost:3000/2fa/disable", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to disable 2FA");
      const updatedUser = { ...user, twoFactorEnabled: false };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setStage("start");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <Header />
      <div className="container" style={{ maxWidth: 420, minHeight: "80vh" }}>
        <div className="card shadow mt-5">
          <div className="card-body p-4">
            <h3 className="mb-3 text-center">Two-Factor Authentication (2FA)</h3>
            {error && <div className="alert alert-danger">{error}</div>}

            {stage === "loading" && (
              <div>Loading...</div>
            )}

            {stage === "enabled" && (
              <div className="alert alert-success text-center">
                <b>2FA is enabled for your account.</b>
                <br />
                <button className="btn btn-outline-danger mt-3" onClick={disable2FA}>
                  Turn Off 2FA
                </button>
              </div>
            )}

            {stage === "verified" && (
              <div className="alert alert-success text-center">
                <b>2FA is now enabled!</b>
                <br />
                <button className="btn btn-outline-danger mt-3" onClick={disable2FA}>
                  Turn Off 2FA
                </button>
              </div>
            )}

            {stage === "start" && (
              <>
                <p>
                  <b>2FA is not enabled.</b>
                  <br />
                  Add extra protection with an authenticator app.
                </p>
                <button className="btn btn-primary w-100" onClick={start2FA}>
                  Enable 2FA (Get QR Code)
                </button>
              </>
            )}

            {stage === "qr" && (
              <>
                <p>
                  1. Scan this QR code with your authenticator app.<br />
                  2. Enter the 6-digit code shown in your app.
                </p>
                {qrCode && (
                  <div className="text-center mb-3">
                    <img src={qrCode} alt="QR Code" style={{ width: 220 }} />
                  </div>
                )}
                <form onSubmit={verifyOtp}>
                  <div className="mb-3">
                    <label className="form-label">Enter code from app:</label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      required
                    />
                  </div>
                  <button className="btn btn-success w-100" type="submit">
                    Verify &amp; Enable 2FA
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Enable2FA;
