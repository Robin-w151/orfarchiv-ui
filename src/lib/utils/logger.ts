type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private levelToBackgroundMap = new Map<LogLevel, string>([
    ['debug', '#7f8c8d'],
    ['info', '#3498db'],
    ['warn', '#f39c12'],
    ['error', '#e74c3c'],
  ]);

  debug(...args: Array<any>): void {
    this.log('debug', ...args);
  }

  info(...args: Array<any>): void {
    this.log('info', ...args);
  }

  warn(...args: Array<any>): void {
    this.log('warn', ...args);
  }

  error(...args: Array<any>): void {
    this.log('error', ...args);
  }

  debugGroup(title: string, logs: Array<Array<any>>, collapse = false): void {
    this.logGroup('debug', title, logs, collapse);
  }

  infoGroup(title: string, logs: Array<Array<any>>, collapse = false): void {
    this.logGroup('info', title, logs, collapse);
  }

  warnGroup(title: string, logs: Array<Array<any>>, collapse = false): void {
    this.logGroup('warn', title, logs, collapse);
  }

  errorGroup(title: string, logs: Array<Array<any>>, collapse = false): void {
    this.logGroup('error', title, logs, collapse);
  }

  private log(level: LogLevel, ...args: Array<any>): void {
    const logFn = this.getLogFn(level);
    logFn('%corf-archiv', this.getStyles(level).join(';'), ...args);
  }

  private logGroup(level: LogLevel, title: string, logs: Array<Array<any>>, collapse = false): void {
    const logFn = this.getLogFn(level);
    const logGroupFn = collapse ? console.groupCollapsed : console.group;

    logGroupFn('%corf-archiv', this.getStyles(level).join(';'), title);
    for (const args of logs) {
      logFn(...args);
    }
    console.groupEnd();
  }

  private getLogFn(level: LogLevel): (...args: Array<any>) => void {
    switch (level) {
      case 'warn':
        return console.warn;
      case 'error':
        return console.error;
      default:
        return console.log;
    }
  }

  private getStyles(level: LogLevel): Array<string> {
    const background = this.levelToBackgroundMap.get(level);
    return [
      `background: ${background}`,
      `border-radius: 0.5em`,
      `color: white`,
      `font-weight: bold`,
      `padding: 2px 0.5em`,
    ];
  }
}

export const logger = new Logger();
