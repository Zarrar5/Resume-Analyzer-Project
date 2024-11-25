import React, { useState } from 'react';
import { Navigate } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';  

const Login = ({onLoginSuccess}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);  
  const navigate= useNavigate();
  const handleLogin = async (event) => {
    event.preventDefault();

    setLoading(true);  

    try {
      const response = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username,
          password,
        }),
      });

      setLoading(false); 

      if (response.ok) {
        const data = await response.json();
        const token = data.token;
        localStorage.setItem('access_token', token);
        setMessage('Login successful');
        onLoginSuccess();
        navigate('/', {state: {message: 'Login Successful'}});

      } else {
        const errorData = await response.json();
        setMessage(errorData.detail || 'Invalid username or password');
      }
    } catch (error) {
      setLoading(false);  
      setMessage('An error occurred: ' + error.message);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {loading && <LoadingSpinner/>} 
      <form onSubmit={handleLogin}>
        <label>
          Username:
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
          Password:
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <br />
        <button type="submit">Login</button>
      </form>
      <p>{message}</p>
    </div>
  );
};

export default Login;
