/**
 * Structured logging utility
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

function formatLog(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
  };

  if (data) {
    logEntry.data = data;
  }

  return JSON.stringify(logEntry);
}

export const logger = {
  error: (message, data) => {
    console.error(formatLog(LOG_LEVELS.ERROR, message, data));
  },
  warn: (message, data) => {
    console.warn(formatLog(LOG_LEVELS.WARN, message, data));
  },
  info: (message, data) => {
    console.log(formatLog(LOG_LEVELS.INFO, message, data));
  },
  debug: (message, data) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatLog(LOG_LEVELS.DEBUG, message, data));
    }
  },
};

export default logger;
