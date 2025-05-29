<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../pages/Homepage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import CreateListing from "../pages/CreateListing";
import Chat from "../components/Chat";
import { AuthProvider } from "./context/Authcontext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/create-listing" element={<CreateListing />} />
          {/* Legacy route for backward compatibility */}
          <Route path="/create-post" element={<CreateListing />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </Router>
    </AuthProvider>
=======
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/Homepage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage'; 
import CreateListing from '../pages/CreateListing';
import ProtectedRoute from '../components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Protected Routes - Require Authentication */}
        <Route 
          path="/create-listing" 
          element={
            <ProtectedRoute>
              <CreateListing />
            </ProtectedRoute>
          } 
        />
        
        {/* Legacy route for backward compatibility */}
        <Route 
          path="/create-post" 
          element={
            <ProtectedRoute>
              <CreateListing />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
>>>>>>> 32f1c548629b79edbeaf1e81a9faa137da66b696
  );
}

export default App;
