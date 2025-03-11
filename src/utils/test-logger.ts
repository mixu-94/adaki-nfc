// src/utils/test-logger.ts
import fs from 'fs';
import path from 'path';

export class TestLogger {
    private static logDir = path.join(process.cwd(), 'test-logs');
    private static logFile = path.join(TestLogger.logDir, 'test-results.log');

    /**
     * Initializes the test logger by creating the log directory and file
     */
    static init(): void {
        // Create directory if it doesn't exist
        if (!fs.existsSync(TestLogger.logDir)) {
            fs.mkdirSync(TestLogger.logDir, { recursive: true });
        }

        // Initialize log file with timestamp header
        const timestamp = new Date().toISOString();
        fs.writeFileSync(
            TestLogger.logFile,
            `# TEST EXECUTION REPORT - ${timestamp}\n\n`,
            { flag: 'w' }
        );
    }

    /**
     * Logs a test result to the log file
     * @param testName - Name of the test (can be undefined, handled safely)
     * @param passed - Whether the test passed
     * @param details - Optional details about the test
     */
    static logTestResult(testName: string | undefined, passed: boolean, details?: any): void {
        const status = passed ? 'PASS' : 'FAIL';
        const testNameSafe = testName || 'Unnamed Test';
        const entry = `[${status}] ${testNameSafe}\n${details ? JSON.stringify(details, null, 2) : ''}\n\n`;

        fs.appendFileSync(TestLogger.logFile, entry);
    }

    /**
     * Logs coverage information to the log file
     * @param coverage - Coverage data
     */
    static logCoverage(coverage: any): void {
        fs.appendFileSync(
            TestLogger.logFile,
            `# COVERAGE SUMMARY\n${JSON.stringify(coverage, null, 2)}\n\n`
        );
    }
}