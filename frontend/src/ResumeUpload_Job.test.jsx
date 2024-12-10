// ResumeUpload_Job.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResumeUpload from './ResumeUpload_Job';
import '@testing-library/jest-dom/extend-expect';

// Mock the LoadingSpinner component
jest.mock('./LoadingSpinner', () => () => <div>Loading...</div>);

// Mock alert to avoid interruption by invalid file upload alert
beforeAll(() => {
  global.alert = jest.fn();  // Mocking alert
});

describe('ResumeUpload Component', () => {

  beforeEach(() => {
    render(<ResumeUpload />);
  });

  test('renders without crashing', () => {
    expect(screen.getByText('Resume Upload')).toBeInTheDocument();
  });

  test('displays file input and allows PDF file upload', () => {
    const fileInput = screen.getByLabelText('Resume Upload').nextSibling;

    const mockFile = new File(['test'], 'test_resume.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: true,
    });

    fireEvent.change(fileInput);
    expect(screen.getByText('Submit Resume')).toBeEnabled();
  });

  test('shows error message when uploading a non-PDF file', () => {
    const fileInput = screen.getByLabelText('Resume Upload').nextSibling;

    const mockFile = new Blob(['test'], { type: 'application/text' });
    Object.defineProperty(fileInput, 'files', {
      value: [new File([mockFile], 'test_resume.txt', { type: 'application/text' })],
    });

    fireEvent.change(fileInput);

    // Check if alert was triggered
    expect(global.alert).toHaveBeenCalledWith('Please upload a valid PDF file.');
  });

  test('displays message if file size exceeds 2MB', () => {
    const fileInput = screen.getByLabelText('Resume Upload').nextSibling;

    const mockFile = new Blob(['test'], { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', {
      value: [new File([mockFile], 'test_resume.pdf', { type: 'application/pdf', size: 3 * 1024 * 1024 })], // 3MB file
      writable: true,
    });

    fireEvent.change(fileInput);
    expect(screen.getByText('File Larger Than 2MB')).toBeInTheDocument();
  });

  test('handles character count and displays max characters warning', () => {
    const textarea = screen.getByLabelText(/Job Description/i);
    userEvent.type(textarea, 'a'.repeat(4000));
    expect(screen.getByText('Character Count: 4000/5000')).toBeInTheDocument();
    expect(screen.getByText('Max Char almost reached!!!')).toBeInTheDocument();
  });

  test('shows message when the job description exceeds max characters limit', () => {
    const textarea = screen.getByLabelText(/Job Description/i);
    userEvent.type(textarea, 'a'.repeat(5001));
    expect(screen.getByText('Max Char Limit Reached')).toBeInTheDocument();
  });

  test('clears the job description when the "Clear" button is clicked', () => {
    const textarea = screen.getByLabelText(/Job Description/i);
    userEvent.type(textarea, 'Some job description text');
    userEvent.click(screen.getByText(/Clear/i));
    expect(textarea.value).toBe('');
  });

  test('submits job description successfully', async () => {
    const textarea = screen.getByLabelText(/Job Description/i);
    const submitButton = screen.getByText('Submit Job Description');
    
    userEvent.type(textarea, 'Some job description');
    fireEvent.click(submitButton);
    
    await waitFor(() => expect(screen.getByText('Job description submitted successfully')).toBeInTheDocument());
  });

  test('shows loading spinner during form submission', async () => {
    const fileInput = screen.getByLabelText('Resume Upload').nextSibling;

    const mockFile = new File(['test'], 'test_resume.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: true,
    });

    fireEvent.change(fileInput);

    const submitButton = screen.getByText('Submit Resume');
    fireEvent.click(submitButton);

    // Check that loading spinner is visible
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for the message to appear
    await waitFor(() => expect(screen.getByText('resume updated successfully')).toBeInTheDocument());
  });

  test('shows error if resume submission fails', async () => {
    // Mock the fetch API call to simulate an error response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ detail: 'Invalid File' }),
    });

    const fileInput = screen.getByLabelText('Resume Upload').nextSibling;

    const mockFile = new File(['test'], 'test_resume.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: true,
    });

    fireEvent.change(fileInput);

    const submitButton = screen.getByText('Submit Resume');
    fireEvent.click(submitButton);

    await waitFor(() => expect(screen.getByText('An error occurred: Invalid File')).toBeInTheDocument());
  });
});
