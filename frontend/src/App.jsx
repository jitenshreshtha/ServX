import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../pages/Homepage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import CreateListing from "../pages/CreateListing";
import ProfilePage from '../pages/ProfilePage';
import MyListingsPage from '../pages/MyListingsPage';
import Chat from "../components/Chat";
import { AuthProvider } from "./context/Authcontext";
import AdminLoginPage from "../pages/AdminLoginPage";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import ProtectedRoute from '../components/ProtectedRoute';
import AboutUsPage from '../pages/AboutUsPage';
import ContactUsPage from '../pages/ContactUsPage';
import InboxPage from "../pages/InboxPage";
import AuthCallback from '../components/AuthCallback'; 
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* Protected Routes - Require Authentication */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}/>
          <Route path="/my-listings" element={<ProtectedRoute><MyListingsPage /></ProtectedRoute>}/>
          <Route path="/create-listing" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin-dashboard" element={<ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute>} />
          {/* Legacy route for backward compatibility */}
          <Route path="/create-post" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>}/>
          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route path="*" element={
            <div className="container mt-5 text-center">
              <h1>404 - Page Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
              <a href="/" className="btn btn-primary">Go Home</a>
            </div>
          }
        />
          <Route path="/about" element={<AboutUsPage />} />
        <Route path="/contact" element={<ContactUsPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
