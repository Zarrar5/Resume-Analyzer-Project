import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setLoading(true);
    setPasswordError(''); 
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username,
          email,
          password,
        }),
      });

      setLoading(false);

      if (response.ok) {
        const data = await response.json();
        setMessage('Registration successful');
      } else {
        const errorData = await response.json();
        setMessage(errorData.detail || 'Registration failed');
      }
    } catch (error) {
      setLoading(false);
      setMessage('An error occurred: ' + error.message);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      {loading && <LoadingSpinner />}
      <form onSubmit={handleRegister}>
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
          Email:
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        <label>
          Confirm Password:
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>
        <br />
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      {passwordError && <p style={{ color: 'red' }}>{passwordError}</p>}
      <p>{message}</p>
    </div>
  );
};

export default Register;
