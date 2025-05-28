import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/Homepage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage'; 
import CreateListing from '../pages/CreateListing';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/create-listing" element={<CreateListing />} />
        {/* Legacy route for backward compatibility */}
        <Route path="/create-post" element={<CreateListing />} />
      </Routes>
    </Router>
  );
}

export default App;