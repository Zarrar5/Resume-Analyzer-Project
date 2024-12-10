import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

// Mock onLoginSuccess function
const mockOnLoginSuccess = jest.fn();

describe('Login Component - Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it('validates input fields and handles form submission', () => {
    render(
      <BrowserRouter>
        <Login onLoginSuccess={mockOnLoginSuccess} />
      </BrowserRouter>
    );

    // Check if the input fields are present
    const usernameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();

    // Test form validation with empty fields
    fireEvent.click(submitButton);
    expect(screen.getByPlaceholderText('Username')).toBeInvalid();
    expect(screen.getByPlaceholderText('Password')).toBeInvalid();

    // Fill in the input fields
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });

    // Verify the inputs have the correct values
    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('testpassword');

    // Submit the form
    fireEvent.click(submitButton);
    expect(mockOnLoginSuccess).not.toHaveBeenCalled(); // Mock submission behavior
  });
});
