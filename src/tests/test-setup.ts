// src/tests/test-setup.ts
import { TestLogger } from '../utils/test-logger';

// Initialize test logger before all tests
beforeAll(() => {
    TestLogger.init();
});

// Capture test results
afterEach((done) => {
    // @ts-ignore
    const testName = expect.getState().currentTestName;
    // @ts-ignore
    const testStatus = expect.getState().testResults.slice(-1)[0]?.status === 'passed';

    TestLogger.logTestResult(testName, testStatus);
    done();
});

// Log coverage data after all tests
afterAll((done) => {
    // Coverage data is only available in non-watch mode with coverage enabled
    // This would require custom configuration to access
    done();
});