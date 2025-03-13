// jest.config.js
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
            includeFailureMsg: true,
            useCssFile: true,
            theme: 'lightTheme',
            sort: 'status',
            includeConsoleLog: false,
        }],
        // Add the JSON reporter here
        ['jest-junit', {
            outputDirectory: './test-logs',
            outputName: 'junit.xml',
        }]
    ]
};

// // jest.config.js
// module.exports = {
//     preset: 'ts-jest',
//     testEnvironment: 'node',
//     coverageDirectory: 'coverage',
//     collectCoverageFrom: [
//         'src/**/*.{ts,js}',
//         '!src/**/*.d.ts',
//         '!src/tests/**/*',
//     ],
//     testMatch: [
//         '**/tests/unit/**/*.test.{ts,js}',
//         '**/tests/integration/**/*.test.{ts,js}',
//     ],
//     verbose: true,
//     forceExit: true,
//     clearMocks: true,
//     resetMocks: true,
//     restoreMocks: true,
//     setupFilesAfterEnv: ['./src/tests/test-setup.ts'],
//     reporters: [
//         'default',
//         ['./node_modules/jest-html-reporter', {
//             pageTitle: 'NFC Verification Test Report',
//             outputPath: './test-logs/test-report.html',
//             includeFailureMsg: true,
//             // Add optimization options
//             useCssFile: true,
//             theme: 'lightTheme',
//             sort: 'status',
//             // Limit output size
//             statusIgnoreFilter: null,
//             includeConsoleLog: false,
//             // Improve rendering speed
//             styleOverridePath: null
//         }]
//     ]
// };