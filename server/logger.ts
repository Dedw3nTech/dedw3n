/**
 * Production-ready structured logger with level filtering and metadata
 * Supports JSON output, timestamps, and future aggregator integration
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'lifecycle';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  category?: string;
  message: string;
  context?: any;
  error?: Error | string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  lifecycle: 2,
  info: 3,
  debug: 4
};

const MIN_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 
  (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[MIN_LOG_LEVEL];
}

function formatLogEntry(entry: LogEntry): string {
  if (process.env.LOG_FORMAT === 'json') {
    return JSON.stringify(entry);
  }
  // Human-readable format for development
  const parts = [
    entry.timestamp,
    `[${entry.level.toUpperCase()}]`,
    entry.category ? `[${entry.category}]` : '',
    entry.message
  ].filter(Boolean);
  
  let output = parts.join(' ');
  if (entry.context) {
    output += ` ${JSON.stringify(entry.context)}`;
  }
  if (entry.error) {
    output += ` Error: ${entry.error instanceof Error ? entry.error.message : entry.error}`;
  }
  return output;
}

function log(level: LogLevel, message: string, context?: any, error?: Error | string, category?: string): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...(category && { category }),
    ...(context && { context }),
    ...(error && { error: error instanceof Error ? error.message : error })
  };

  const formatted = formatLogEntry(entry);
  
  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export const logger = {
  error: (message: string, context?: any, error?: Error | string, category?: string) => 
    log('error', message, context, error, category),
  
  warn: (message: string, context?: any, category?: string) => 
    log('warn', message, context, undefined, category),
  
  info: (message: string, context?: any, category?: string) => 
    log('info', message, context, undefined, category),
  
  debug: (message: string, context?: any, category?: string) => 
    log('debug', message, context, undefined, category),
  
  lifecycle: (message: string, context?: any, category?: string) => 
    log('lifecycle', message, context, undefined, category)
};