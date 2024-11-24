import React from 'react';
import Login from './Login';
import Register from './Register';
import ResumeUpload from './ResumeUpload';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

function App() {
  //Track whether the user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  //Logout
  const handleLogout= () => {
    setIsLoggedIn(false);
    localStorage.removeItem('access_token');
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);  // If token exists, user is logged in
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
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<h2>Welcome to the Home Page</h2>} />
          <Route path="/login" element={<Login onLoginSuccess={() => setIsLoggedIn(true)}/>} />
          <Route path="/register" element={<Register />} />
          {isLoggedIn && <Route path="/resume-upload" element={<ResumeUpload/>} />}
          <Route
            path="*"
            element={<Navigate to="/" />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
