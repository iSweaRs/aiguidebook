const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  preset: '@shelf/jest-mongodb',
  testEnvironment: 'node',
  // Coverage Configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}', // Track all files in the app folder
    '!app/**/*.d.ts',           // Ignore type definitions
    '!app/**/layout.tsx',       // Optional: ignore standard Next.js layouts
    '!app/lib/db/seed.ts',      // Don't track coverage for your seeding script
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'], // 'text' shows a table in terminal, 'lcov' creates a website
};

module.exports = createJestConfig(customJestConfig);