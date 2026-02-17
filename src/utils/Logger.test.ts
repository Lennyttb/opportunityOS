import { Logger } from './Logger';
import { LogLevel } from '../types';

describe('Logger', () => {
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    Logger.reset();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();
      expect(logger1).toBe(logger2);
    });

    it('should initialize with default log level INFO', () => {
      const logger = Logger.getInstance();
      expect(logger.getLogLevel()).toBe(LogLevel.INFO);
    });

    it('should allow setting log level on creation', () => {
      const logger = Logger.getInstance(LogLevel.DEBUG);
      expect(logger.getLogLevel()).toBe(LogLevel.DEBUG);
    });
  });

  describe('child', () => {
    it('should create child logger with nested context', () => {
      const logger = Logger.getInstance(LogLevel.INFO, 'Parent');
      const child = logger.child('Child');

      child.info('test message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Parent:Child]')
      );
    });
  });

  describe('log level filtering', () => {
    it('should log messages at or above the set level', () => {
      const logger = Logger.getInstance(LogLevel.WARN);

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log all messages when level is DEBUG', () => {
      const logger = Logger.getInstance(LogLevel.DEBUG);

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('message formatting', () => {
    it('should include timestamp, level, context, and message', () => {
      const logger = Logger.getInstance(LogLevel.INFO, 'TestContext');
      logger.info('test message');

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/); // timestamp
      expect(call).toContain('[INFO]');
      expect(call).toContain('[TestContext]');
      expect(call).toContain('test message');
    });

    it('should include metadata when provided', () => {
      const logger = Logger.getInstance(LogLevel.INFO);
      logger.info('test message', { userId: '123', action: 'login' });

      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain('"userId":"123"');
      expect(call).toContain('"action":"login"');
    });

    it('should include error details in error logs', () => {
      const logger = Logger.getInstance(LogLevel.ERROR);
      const error = new Error('Test error');
      logger.error('An error occurred', error);

      const call = consoleErrorSpy.mock.calls[0][0];
      expect(call).toContain('An error occurred');
      expect(call).toContain('"error":"Test error"');
      expect(call).toContain('"stack"');
    });
  });

  describe('setLogLevel', () => {
    it('should update log level', () => {
      const logger = Logger.getInstance(LogLevel.INFO);
      expect(logger.getLogLevel()).toBe(LogLevel.INFO);

      logger.setLogLevel(LogLevel.DEBUG);
      expect(logger.getLogLevel()).toBe(LogLevel.DEBUG);
    });
  });
});

