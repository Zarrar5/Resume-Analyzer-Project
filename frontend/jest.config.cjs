module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',  // Transform JS/JSX/TS/TSX files using Babel
    '^.+\\.mjs$': 'babel-jest',  // Transform .mjs files using Babel
  },
  transformIgnorePatterns: [
    "/node_modules/(?!react-pdf|pdfjs-dist)/",  // Do not ignore react-pdf and pdfjs-dist
  ],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/src/__mocks__/styleMock.js',  // Mock CSS imports
  },
  globals: {
    'pdfjs-dist': {
      // Any additional configuration for pdfjs-dist, if necessary
    },
  },
};
