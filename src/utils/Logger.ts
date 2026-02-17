import { LogLevel } from '../types';

/**
 * Logger utility for structured logging
 */
export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private context: string;

  private constructor(logLevel: LogLevel = LogLevel.INFO, context: string = 'OpportunityOS') {
    this.logLevel = logLevel;
    this.context = context;
  }

  /**
   * Get or create singleton instance
   */
  public static getInstance(logLevel?: LogLevel, context?: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(logLevel, context);
    } else if (logLevel !== undefined) {
      Logger.instance.setLogLevel(logLevel);
    }
    return Logger.instance;
  }

  /**
   * Create a child logger with a specific context
   */
  public child(context: string): Logger {
    const childLogger = new Logger(this.logLevel, `${this.context}:${context}`);
    return childLogger;
  }

  /**
   * Set the log level
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Get the current log level
   */
  public getLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Format log message
   */
  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}${metaStr}`;
  }

  /**
   * Log debug message
   */
  public debug(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }

  /**
   * Log info message
   */
  public info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, meta));
    }
  }

  /**
   * Log warning message
   */
  public warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }
  }

  /**
   * Log error message
   */
  public error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorMeta = error
        ? { ...meta, error: error.message, stack: error.stack }
        : meta;
      console.error(this.formatMessage(LogLevel.ERROR, message, errorMeta));
    }
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  public static reset(): void {
    Logger.instance = undefined as any;
  }
}

