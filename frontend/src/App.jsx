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
  );
}

export default App;