// Add custom Jest matchers for DOM testing
import '@testing-library/jest-dom';

// Optional: Mock browser APIs
global.matchMedia = global.matchMedia || function () {
  return {
    matches: false,
    addListener: () => {},
    removeListener: () => {},
  };
};

// Optional: Clean up after each test
import { cleanup } from '@testing-library/react';
afterEach(cleanup);

