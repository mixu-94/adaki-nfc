module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.{ts,js}',
        '!src/**/*.d.ts',
        '!src/tests/**/*',
    ],
    testMatch: [
        '**/tests/unit/**/*.test.{ts,js}',
        '**/tests/integration/**/*.test.{ts,js}',
    ],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    setupFilesAfterEnv: ['./src/tests/test-setup.ts'],
    reporters: [
        'default',
        ['./node_modules/jest-html-reporter', {
            pageTitle: 'NFC Verification Test Report',
            outputPath: './test-logs/test-report.html',
            includeFailureMsg: true
        }]
    ]
};