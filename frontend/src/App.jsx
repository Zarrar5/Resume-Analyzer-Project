import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import ResumeUpload from './ResumeUpload_Job';
import CurrentData from './CurrentData';

function App() {
  // Track whether the user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Logout handler
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('access_token');
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true); // If token exists, user is logged in
    }
  }, []);

  return (
    <BrowserRouter>
      <div>
        <h1>Home</h1>
        <nav>
          <ul>
            {isLoggedIn ? (
              <>
                <li>
                  <button onClick={handleLogout}>Logout</button>
                </li>
                <li>
                  <Link to="/resume-upload">Resume Upload</Link>
                </li>
                <li>
                  <Link to='/current-data'>Data</Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login">Login</Link>
                </li>
                <li>
                  <Link to="/register">Register</Link>
                </li>
              </>
            )}
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={() => setIsLoggedIn(true)} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard"
            element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route path="/resume-upload"
            element={isLoggedIn ? <ResumeUpload /> : <Navigate to="/login" />}
          />
          <Route path="/current-data"
            element={isLoggedIn ? <CurrentData /> : <Navigate to="/login" />}
          />
          
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
