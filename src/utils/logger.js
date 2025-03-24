import pino from 'pino';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const logLevel = process.env.LOG_LEVEL || 'info';

const logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

export default logger;