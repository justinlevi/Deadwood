module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/__tests__/**/*.(ts|tsx|js|cjs)', '**/*.(test|spec).(ts|tsx|js|cjs)'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
}
