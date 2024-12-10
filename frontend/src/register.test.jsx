import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Register from './Register';

describe('Register Component - Validation and Form Submission', () => {
  it('displays an error when passwords do not match', async () => {
    render(<Register />);

    // Fill the form fields
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
      target: { value: 'password456' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Assert the error message is displayed
    expect(
      await screen.findByText('Passwords do not match', {}, { timeout: 3000 })
    ).toBeInTheDocument();
  });
});
