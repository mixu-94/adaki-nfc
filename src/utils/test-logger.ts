// src/utils/test-logger.ts
import fs from 'fs';
import path from 'path';

export class TestLogger {
    private static logDir = path.join(process.cwd(), 'test-logs');
    private static logFile = path.join(TestLogger.logDir, 'test-results.log');

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

    static logTestResult(testName: string, passed: boolean, details?: any): void {
        const status = passed ? 'PASS' : 'FAIL';
        const entry = `[${status}] ${testName}\n${details ? JSON.stringify(details, null, 2) : ''}\n\n`;

        fs.appendFileSync(TestLogger.logFile, entry);
    }

    static logCoverage(coverage: any): void {
        fs.appendFileSync(
            TestLogger.logFile,
            `# COVERAGE SUMMARY\n${JSON.stringify(coverage, null, 2)}\n\n`
        );
    }
}