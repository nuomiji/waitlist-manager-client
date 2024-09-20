import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',                          // Use ts-jest for TypeScript
  testEnvironment: 'jsdom',                    // Simulate browser environment for React
  setupFilesAfterEnv: ['@testing-library/jest-dom', './setupTests.ts'], // Extend matchers
  transform: {
    '^.+\\.tsx?$': 'ts-jest',                  // Transpile TypeScript files with ts-jest
    '^.+\\.css$': 'jest-transform-stub',       // Stub CSS imports
  },
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',           // Mock CSS modules if you're using CSS modules
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

export default config;