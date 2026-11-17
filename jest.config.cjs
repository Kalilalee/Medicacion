module.exports = {
  preset: 'jest-expo',
  testTimeout: 20000,
  setupFilesAfterEnv: ['./jest.setup.cjs'],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  collectCoverageFrom: ['src/utils/**/*.ts', 'src/services/**/*.ts', 'src/components/MedicationCard.tsx', '!**/*.web.ts'],
};
