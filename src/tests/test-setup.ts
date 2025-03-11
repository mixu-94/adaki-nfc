// src/tests/test-setup.ts
import { TestLogger } from '../utils/test-logger';

// Initialize test logger before all tests
beforeAll(() => {
    TestLogger.init();
});

// Capture test results
afterEach((done) => {
    // Use type assertions to safely extract test information
    const testState: any = expect.getState();
    const testName = testState?.currentTestName;
    const testStatus = testState?.testResults?.slice(-1)[0]?.status === 'passed';

    TestLogger.logTestResult(testName, !!testStatus);
    done();
});

// Log coverage data after all tests
afterAll((done) => {
    // Coverage data is only available in non-watch mode with coverage enabled
    // This would require custom configuration to access
    done();
});