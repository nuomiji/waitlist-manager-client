// setupTests.ts

import '@testing-library/jest-dom';  // This extends Jest matchers with DOM-related assertions

global.setImmediate = require('timers-browserify').setImmediate;

// Add an empty export to make it a module
export {};
