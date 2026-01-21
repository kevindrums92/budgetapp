/**
 * Environment-aware logging utility
 *
 * In production builds, all logs are silenced to avoid console spam.
 * In development, logs are printed with namespace formatting for easier debugging.
 *
 * @example
 * ```typescript
 * import { logger } from '@/shared/utils/logger';
 *
 * logger.debug('CloudSync', 'Starting sync...');
 * logger.info('Backup', 'Backup created successfully');
 * logger.warn('Storage', 'LocalStorage quota approaching limit');
 * logger.error('API', 'Failed to fetch data', error);
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = import.meta.env.DEV;

class Logger {
  /**
   * Debug-level logging (lowest priority)
   * Use for detailed debugging information
   */
  debug(namespace: string, message: string, ...args: unknown[]): void {
    if (isDevelopment) {
      console.log(`[${namespace}] ${message}`, ...args);
    }
  }

  /**
   * Info-level logging
   * Use for general informational messages
   */
  info(namespace: string, message: string, ...args: unknown[]): void {
    if (isDevelopment) {
      console.log(`[${namespace}] ${message}`, ...args);
    }
  }

  /**
   * Warning-level logging
   * Use for potentially problematic situations
   */
  warn(namespace: string, message: string, ...args: unknown[]): void {
    if (isDevelopment) {
      console.warn(`[${namespace}] ${message}`, ...args);
    }
  }

  /**
   * Error-level logging (highest priority)
   * Use for error conditions
   * Note: Errors are logged even in production for critical issues
   */
  error(namespace: string, message: string, ...args: unknown[]): void {
    if (isDevelopment) {
      console.error(`[${namespace}] ${message}`, ...args);
    }
    // In production, we might want to send errors to a monitoring service
    // For now, we keep production console clean
  }

  /**
   * Log a message at a specific level
   */
  log(level: LogLevel, namespace: string, message: string, ...args: unknown[]): void {
    switch (level) {
      case 'debug':
        this.debug(namespace, message, ...args);
        break;
      case 'info':
        this.info(namespace, message, ...args);
        break;
      case 'warn':
        this.warn(namespace, message, ...args);
        break;
      case 'error':
        this.error(namespace, message, ...args);
        break;
    }
  }
}

export const logger = new Logger();
