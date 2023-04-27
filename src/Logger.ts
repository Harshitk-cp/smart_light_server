import chalk from "chalk";

import { LOG_LEVEL } from "./enums.js";

class Logger {
  private static _level = LOG_LEVEL.DEBUG;

  static setLevel(level: LOG_LEVEL) {
    Logger._level = level;
  }

  static error(label: string, ...args: unknown[]) {
    if (Logger._level >= LOG_LEVEL.INFO) {
      console.log(chalk.red(`[${label}]`, ">", ...args));
    }
  }

  static warn(label: string, ...args: unknown[]) {
    if (Logger._level >= LOG_LEVEL.INFO) {
      console.log(chalk.yellow(`[${label}]`, ">", ...args));
    }
  }

  static info(label: string, ...args: unknown[]) {
    if (Logger._level >= LOG_LEVEL.INFO) {
      console.log(chalk.green(`[${label}]`, ">", ...args));
    }
  }

  static debug(label: string, ...args: unknown[]) {
    if (Logger._level >= LOG_LEVEL.DEBUG) {
      console.log(`[${label}]`, ">", ...args);
    }
  }
}

export default Logger;
