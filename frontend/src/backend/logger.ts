export const LOGGER_LEVEL = {
  FATAL: 'fatal', // Severe errors that stops the whole application
  ERROR: 'error', // Errors that stop part of the application
  WARN: 'warn', // Urgent events that do not stop the application but must be addressed
  INFO: 'info', // Informative high-level messages ("Service started")
  DEBUG: 'debug', // Detailed information for developers
  TRACE: 'trace', // Most granular level to track all progress
} as const;

export type LoggerLevel = typeof LOGGER_LEVEL[
  keyof typeof LOGGER_LEVEL
];

export type LoggerMethod = (message: string, data?: Record<string, any>) => void;

export type Logger = {
  fatal(message: string, data?: Record<string, any>): void;
  error(message: string, data?: Record<string, any>): void;
  warn(message: string, data?: Record<string, any>): void;
  info(message: string, data?: Record<string, any>): void;
  debug(message: string, data?: Record<string, any>): void;
  trace(message: string, data?: Record<string, any>): void;
};

export class ConsoleLogger {
  name!: string;
  #allowedLevels!: Set<LoggerLevel>;

  constructor(name: string, minLevel?: LoggerLevel) {
    this.name = name;
    this.#allowedLevels = this.#parseMinLevel(minLevel);
  }

  fatal(message: string, data?: Record<string, any>): void {
    this.log(LOGGER_LEVEL.FATAL, message, data);
  }

  error(message: string, data?: Record<string, any>): void {
    this.log(LOGGER_LEVEL.ERROR, message, data);
  }

  warn(message: string, data?: Record<string, any>): void {
    this.log(LOGGER_LEVEL.WARN, message, data);
  }

  info(message: string, data?: Record<string, any>): void {
    this.log(LOGGER_LEVEL.INFO, message, data);
  }

  debug(message: string, data?: Record<string, any>): void {
    this.log(LOGGER_LEVEL.DEBUG, message, data);
  }

  trace(message: string, data?: Record<string, any>): void {
    this.log(LOGGER_LEVEL.TRACE, message, data);
  }

  log(level: LoggerLevel, message: string, data?: Record<string, any>): void {
    if (!this.#allowedLevels.has(level)) {
      return;
    }

    const logMessage = `[${this.name}][${level.toUpperCase()}] ${message}`;
    console.log(logMessage, data);
  }

  #parseMinLevel(level?: LoggerLevel): Set<LoggerLevel> {
    const result = new Set<LoggerLevel>();

    result.add(LOGGER_LEVEL.FATAL);
    if (level === LOGGER_LEVEL.FATAL) return result;

    result.add(LOGGER_LEVEL.ERROR);
    if (level === LOGGER_LEVEL.ERROR) return result;

    result.add(LOGGER_LEVEL.WARN);
    if (level === LOGGER_LEVEL.WARN) return result;

    result.add(LOGGER_LEVEL.INFO);
    if (level === LOGGER_LEVEL.INFO) return result;

    result.add(LOGGER_LEVEL.DEBUG);
    if (level === LOGGER_LEVEL.DEBUG) return result;

    result.add(LOGGER_LEVEL.TRACE);
    if (level === LOGGER_LEVEL.TRACE) return result;

    return result;
  }
};